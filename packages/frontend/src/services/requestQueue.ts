import type { ModelType } from '../api/api-deepseekStream';
import { getCurrentModel } from '../api/api-deepseekStream';

interface QueueItem {
    prompt: string;
    onChunk: (chunk: string) => void;
    mode?: 'speed_test';
    retryCount: number;
    index: number;
    startTime?: number;
    endTime?: number;
}

export class RequestQueue {
    private queue: QueueItem[] = [];
    private activeRequests = new Map<number, Promise<void>>();
    private maxConcurrent = 10; // 可配置的最大并发数
    private lastErrorTime: number | null = null;
    private static instance: RequestQueue;

    // 单例模式
    private constructor() { }

    static getInstance(): RequestQueue {
        if (!RequestQueue.instance) {
            RequestQueue.instance = new RequestQueue();
        }
        return RequestQueue.instance;
    }

    // 添加新请求到队列并尝试立即执行
    async enqueue(prompt: string, onChunk: (chunk: string) => void, index?: number, mode?: 'speed_test'): Promise<void> {
        console.log(`[RequestQueue] Enqueueing request ${index}:`, {
            prompt: prompt.slice(0, 100) + '...',
            activeRequests: this.activeRequests.size,
            maxConcurrent: this.maxConcurrent
        });

        const request: QueueItem = {
            prompt,
            onChunk,
            mode,
            retryCount: 0,
            index: index || Date.now()
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

    // 处理队列中的请求
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
                    console.log(`[RequestQueue] Waiting ${waitTime}ms before retry for request ${request.index}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                // 包装onChunk回调以检测完成状态
                const wrappedOnChunk = (chunk: string) => {
                    console.log(`[RequestQueue] Processing chunk for request ${request.index}:`, {
                        chunk,
                        isDone,
                        hasError
                    });

                    if (chunk.includes('[DONE]')) {
                        isDone = true;
                    } else if (chunk.includes('[ERROR]')) {
                        hasError = true;
                    }

                    // 确保在调用onChunk之前进行安全检查
                    try {
                        request.onChunk(chunk);
                    } catch (error) {
                        console.error(`Error in onChunk callback for request ${request.index}:`, error);
                        hasError = true;
                        throw error; // 重新抛出错误以便被外层catch捕获
                    }
                };

                // 导入 RequestAI 函数
                const { RequestAI } = await import('../api/api-deepseekStream');
                await RequestAI(getCurrentModel(), request.prompt, wrappedOnChunk, request.mode);

                // 确保请求正确完成
                if (!isDone && !hasError) {
                    console.log(`[RequestQueue] Request ${request.index} completed but no [DONE] marker received, sending one...`);
                    // 如果没有收到[DONE]标记，手动发送一个
                    wrappedOnChunk('[DONE]');
                } else {
                    console.log(`[RequestQueue] Request ${request.index} completed with status:`, {
                        isDone,
                        hasError
                    });
                }

                this.lastErrorTime = null; // 重置错误时间

            } catch (error) {
                console.error(`[RequestQueue] Error processing request ${request.index}:`, error);
                await this.handleError(request, error);
            } finally {
                request.endTime = Date.now();
                this.activeRequests.delete(request.index);
                // 尝试处理队列中的下一个请求
                this.processQueue();
            }
        })();

        // 将请求添加到活跃请求Map中
        this.activeRequests.set(request.index, requestPromise);
        return requestPromise;
    }

    private async handleError(request: QueueItem, error: any): Promise<void> {
        const maxRetries = 3;
        const isRetryable = this.isRetryableError(error);

        console.log(`[RequestQueue] Handling error for request ${request.index}:`, {
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
            console.log(`[RequestQueue] Will retry request ${request.index} (attempt ${request.retryCount})`);
        } else {
            console.log(`[RequestQueue] Request ${request.index} failed permanently`);
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
        requestTimes: { [key: number]: { start?: number; end?: number } };
    } {
        const requestTimes: { [key: number]: { start?: number; end?: number } } = {};
        this.queue.forEach(request => {
            requestTimes[request.index] = {
                start: request.startTime,
                end: request.endTime
            };
        });

        return {
            queueLength: this.queue.length,
            activeRequests: this.activeRequests.size,
            maxConcurrent: this.maxConcurrent,
            requestTimes
        };
    }

    // 设置最大并发数
    setMaxConcurrent(value: number): void {
        if (value > 0) {
            this.maxConcurrent = value;
            console.log(`[RequestQueue] Max concurrent requests set to ${value}`);
        }
    }
}
