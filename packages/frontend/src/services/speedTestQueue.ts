import type { ModelType } from '../api/api-deepseekStream.js';
import { useModelConfig } from '../composables/useModelConfig';

const { getModelMaxTokens } = useModelConfig();

interface QueueItem {
    model: ModelType;
    onChunk: (chunk: string) => void;
    retryCount: number;
    startTime?: number;
    endTime?: number;
}

export class SpeedTestQueue {
    private queue: QueueItem[] = [];
    private activeRequests = new Map<string, Promise<void>>();
    private maxConcurrent = 4; // 固定并发数为4
    private lastErrorTime: number | null = null;
    private static instance: SpeedTestQueue;

    private constructor() { }

    static getInstance(): SpeedTestQueue {
        if (!SpeedTestQueue.instance) {
            SpeedTestQueue.instance = new SpeedTestQueue();
        }
        return SpeedTestQueue.instance;
    }

    async enqueue(model: ModelType, onChunk: (chunk: string) => void): Promise<void> {
        console.log(`[SpeedTestQueue] Enqueueing model test:`, {
            model,
            activeRequests: this.activeRequests.size,
            maxConcurrent: this.maxConcurrent
        });

        const request: QueueItem = {
            model,
            onChunk,
            retryCount: 0
        };

        // 如果当前活跃请求数小于最大并发数，直接执行
        if (this.activeRequests.size < this.maxConcurrent) {
            await this.executeRequest(request);
        } else {
            // 将请求加入队列
            this.queue.push(request);
            // 等待任意一个请求完成后再处理队列
            await Promise.race(this.activeRequests.values());
            await this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        // 当有空闲槽位且队列不为空时，继续处理
        while (this.activeRequests.size < this.maxConcurrent && this.queue.length > 0) {
            const request = this.queue.shift()!;
            await this.executeRequest(request);
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
                    console.log(`[SpeedTestQueue] Waiting ${waitTime}ms before retry for model ${request.model}`);
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

                // 导入 SpeedTestPool
                const { SpeedTestPool } = await import('./speedTestPool.js');
                const pool = SpeedTestPool.getInstance();
                const ws = await pool.getConnection(request.model);

                return new Promise<void>((resolve, reject) => {
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
                                    if (response.message) {
                                        wrappedOnChunk(`[ERROR] ${response.message}`);
                                    }
                                    reject(new Error(response.message || 'Unknown error'));
                                    break;
                                case 'complete':
                                    wrappedOnChunk('[DONE]');
                                    resolve();
                                    break;
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };

                    const handleError = (error: Event) => {
                        reject(new Error('WebSocket connection error'));
                    };

                    const handleClose = () => {
                        pool.removeListeners(ws);
                    };

                    pool.setListeners(ws, {
                        message: handleMessage,
                        error: handleError,
                        close: handleClose
                    });

                    // 发送测速请求
                    const speedTestRequest = {
                        type: 'stream',
                        model: request.model,
                        messages: [{ role: 'user', content: '你好' }],
                        temperature: 0.7,
                        max_tokens: getModelMaxTokens(request.model),
                        mode: 'speed_test'
                    };

                    ws.send(JSON.stringify(speedTestRequest));
                });

            } catch (error) {
                console.error(`[SpeedTestQueue] Error processing model ${request.model}:`, error);
                await this.handleError(request, error);
            } finally {
                request.endTime = Date.now();
                this.activeRequests.delete(request.model);
                // 尝试处理队列中的下一个请求
                this.processQueue();
            }
        })();

        // 将请求添加到活跃请求Map中
        this.activeRequests.set(request.model, requestPromise);
        return requestPromise;
    }

    private async handleError(request: QueueItem, error: any): Promise<void> {
        const maxRetries = 3;
        const isRetryable = this.isRetryableError(error);

        console.log(`[SpeedTestQueue] Handling error for model ${request.model}:`, {
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
            console.log(`[SpeedTestQueue] Will retry model ${request.model} (attempt ${request.retryCount})`);
        } else {
            console.log(`[SpeedTestQueue] Model ${request.model} test failed permanently`);
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
}
