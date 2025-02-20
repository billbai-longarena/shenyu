// 从executionQueue.ts移动并重命名
import type { ModelType } from '../api/api-deepseekStream.js';
import { useModelConfig } from '../composables/useModelConfig';

const { getModelMaxTokens } = useModelConfig();

interface QueueItem {
    blockIndex: number;
    prompt: string;
    model: ModelType;
    temperature: number;
    onChunk: (chunk: string) => void;
    retryCount: number;
    startTime?: number;
    endTime?: number;
}

export class ExecuteButtonQueue {
    private queue: QueueItem[] = [];
    private activeRequests = new Map<number, Promise<void>>();
    private maxConcurrent = 2; // 执行功能默认并发数为2
    private lastErrorTime: number | null = null;
    private static instance: ExecuteButtonQueue;

    private constructor() { }

    static getInstance(): ExecuteButtonQueue {
        if (!ExecuteButtonQueue.instance) {
            ExecuteButtonQueue.instance = new ExecuteButtonQueue();
        }
        return ExecuteButtonQueue.instance;
    }

    async enqueue(blockIndex: number, prompt: string, model: ModelType, onChunk: (chunk: string) => void, temperature: number): Promise<void> {
        console.log(`[Execute Button Queue] Enqueueing block ${blockIndex}:`, {
            promptLength: prompt.length,
            model,
            temperature,
            activeRequests: this.activeRequests.size,
            maxConcurrent: this.maxConcurrent
        });

        const request: QueueItem = {
            blockIndex,
            prompt,
            model,
            temperature,
            onChunk,
            retryCount: 0
        };

        // 将请求加入队列
        this.queue.push(request);

        // 立即尝试处理队列
        return this.processQueue();
    }

    private async processQueue(): Promise<void> {
        // 收集所有可以立即执行的请求
        const requestsToProcess: QueueItem[] = [];

        while (this.activeRequests.size < this.maxConcurrent && this.queue.length > 0) {
            requestsToProcess.push(this.queue.shift()!);
        }

        if (requestsToProcess.length === 0) {
            return;
        }

        // 并发执行收集到的请求
        const promises = requestsToProcess.map(request => {
            const promise = this.executeRequest(request);
            this.activeRequests.set(request.blockIndex, promise);
            return promise;
        });

        // 等待任意一个请求完成
        try {
            await Promise.race(promises);
        } catch (error) {
            console.error('[Execute Button Queue] Error in request batch:', error);
        }

        // 如果队列中还有请求，继续处理
        if (this.queue.length > 0) {
            // 使用setTimeout来避免可能的调用栈溢出
            setTimeout(() => this.processQueue(), 0);
        }
    }

    private async executeRequest(request: QueueItem): Promise<void> {
        request.startTime = Date.now();
        let isDone = false;
        let hasError = false;

        // 创建请求Promise
        const requestPromise = (async () => {
            try {
                // 检查是否需要等待（如果之前有错误）
                if (this.lastErrorTime) {
                    const waitTime = this.calculateBackoffTime(request.retryCount);
                    console.log(`[Execute Button Queue] Waiting ${waitTime}ms before retry for block ${request.blockIndex}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                // 包装onChunk回调以检测完成状态
                const wrappedOnChunk = (chunk: string) => {
                    if (chunk.includes('[DONE]')) {
                        isDone = true;
                    } else if (chunk.includes('[ERROR]')) {
                        hasError = true;
                    }
                    request.onChunk(chunk);
                };

                // 导入 ExecuteButtonWebSocket
                const { ExecuteButtonWebSocket } = await import('./executeButton.websocket.js');
                const pool = ExecuteButtonWebSocket.getInstance();
                let ws: WebSocket;
                try {
                    ws = await pool.getConnection(request.blockIndex, request.model);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to establish WebSocket connection';
                    console.error('[Execute Button Queue] Connection error:', {
                        error: errorMessage,
                        blockIndex: request.blockIndex,
                        model: request.model
                    });
                    throw new Error(errorMessage);
                }

                return new Promise<void>(async (resolve, reject) => {
                    // 获取max_tokens
                    const max_tokens = await getModelMaxTokens(request.model);

                    const handleMessage = (event: MessageEvent) => {
                        try {
                            const response = JSON.parse(event.data);
                            switch (response.type) {
                                case 'chunk':
                                    if (response.content) {
                                        wrappedOnChunk(response.content);
                                    }
                                    break;
                                case 'error':
                                    let errorMessage = 'Unknown error';
                                    try {
                                        if (response.error && typeof response.error === 'object') {
                                            // 处理API错误对象
                                            errorMessage = response.error.message || response.error.toString();
                                        } else if (response.message) {
                                            // 处理普通错误消息
                                            errorMessage = response.message;
                                        } else if (typeof response.error === 'string') {
                                            // 处理字符串错误
                                            errorMessage = response.error;
                                        }
                                    } catch (parseError) {
                                        console.error('[Execute Button Queue] Error parsing error response:', parseError);
                                    }

                                    // 记录完整的错误信息
                                    console.error('[Execute Button Queue] Error response:', {
                                        error: errorMessage,
                                        fullResponse: response,
                                        blockIndex: request.blockIndex,
                                        model: request.model
                                    });

                                    // 发送错误消息到UI
                                    wrappedOnChunk(`[ERROR] ${errorMessage}`);

                                    // 抛出带有完整信息的错误
                                    reject(new Error(errorMessage));
                                    break;
                                case 'complete':
                                    wrappedOnChunk('[DONE]');
                                    resolve();
                                    break;
                            }
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Failed to parse response';
                            console.error('[Execute Button Queue] Parse error:', {
                                error: errorMessage,
                                blockIndex: request.blockIndex,
                                model: request.model
                            });
                            reject(new Error(errorMessage));
                        }
                    };

                    const handleError = (error: Event) => {
                        const errorMessage = error instanceof Event ? 'WebSocket connection error' : 'Unknown WebSocket error';
                        console.error('[Execute Button Queue] WebSocket error:', {
                            error: errorMessage,
                            blockIndex: request.blockIndex,
                            model: request.model
                        });
                        reject(new Error(errorMessage));
                    };

                    const handleClose = () => {
                        pool.removeListeners(ws);
                    };

                    pool.setListeners(ws, {
                        message: handleMessage,
                        error: handleError,
                        close: handleClose
                    });

                    // 发送执行请求
                    try {
                        const executionRequest = {
                            type: 'stream',
                            model: request.model,
                            messages: [{ role: 'user', content: request.prompt }],
                            temperature: request.temperature,
                            max_tokens
                        };

                        ws.send(JSON.stringify(executionRequest));
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Failed to send request';
                        console.error('[Execute Button Queue] Send error:', {
                            error: errorMessage,
                            blockIndex: request.blockIndex,
                            model: request.model
                        });
                        throw new Error(errorMessage);
                    }
                });

            } catch (error) {
                console.error(`[Execute Button Queue] Error processing block ${request.blockIndex}:`, error);
                await this.handleError(request, error);
            } finally {
                request.endTime = Date.now();
                this.activeRequests.delete(request.blockIndex);
                // 尝试处理队列中的下一个请求
                this.processQueue();
            }
        })();

        // 将请求添加到活跃请求Map中
        this.activeRequests.set(request.blockIndex, requestPromise);
        return requestPromise;
    }

    private async handleError(request: QueueItem, error: any): Promise<void> {
        const maxRetries = 3;
        const isRetryable = this.isRetryableError(error);

        console.log(`[Execute Button Queue] Handling error for block ${request.blockIndex}:`, {
            error: error.message,
            retryCount: request.retryCount,
            isRetryable,
            queueLength: this.queue.length,
            activeRequests: this.activeRequests.size
        });

        if (request.retryCount < maxRetries && isRetryable) {
            request.retryCount++;
            this.lastErrorTime = Date.now();
            // 将请求重新加入队列
            this.queue.unshift(request);
            console.log(`[Execute Button Queue] Will retry block ${request.blockIndex} (attempt ${request.retryCount})`);
        } else {
            console.log(`[Execute Button Queue] Block ${request.blockIndex} failed permanently`);
            request.onChunk(`[ERROR] ${error.message}`);
        }
    }

    private calculateBackoffTime(retryCount: number): number {
        // 指数退避策略：1s, 2s, 4s...，最大10秒
        return Math.min(1000 * Math.pow(2, retryCount), 10000);
    }

    private isRetryableError(error: any): boolean {
        const errorMessage = error.message?.toLowerCase() || '';
        return errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('429') || // HTTP 429 Too Many Requests
            errorMessage.includes('timeout') ||
            errorMessage.includes('socket hang up');
    }

    // 获取当前队列状态（用于调试）
    getQueueStatus(): {
        queueLength: number;
        activeRequests: number;
        maxConcurrent: number;
    } {
        return {
            queueLength: this.queue.length,
            activeRequests: this.activeRequests.size,
            maxConcurrent: this.maxConcurrent
        };
    }

    // 设置最大并发数
    setMaxConcurrent(value: number): void {
        if (value > 0) {
            this.maxConcurrent = value;
            console.log(`[Execute Button Queue] Max concurrent requests set to ${value}`);
        }
    }
}
