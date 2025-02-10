import type { ModelType } from '../api/api-deepseekStream.js';

interface EventListeners {
    message: (event: MessageEvent) => void;
    error: (event: Event) => void;
    close: () => void;
}

export class ExecutionPool {
    private static instance: ExecutionPool;
    private connections: Map<string, WebSocket> = new Map();
    private listeners: Map<string, EventListeners> = new Map();

    private constructor() { }

    static getInstance(): ExecutionPool {
        if (!ExecutionPool.instance) {
            ExecutionPool.instance = new ExecutionPool();
        }
        return ExecutionPool.instance;
    }

    async getConnection(blockIndex: number, model: ModelType): Promise<WebSocket> {
        const timestamp = Date.now();
        const key = `execution_block${blockIndex}_${timestamp}`;
        const ws = await this.createConnection();
        this.connections.set(key, ws);
        return ws;
    }

    private async createConnection(): Promise<WebSocket> {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = import.meta.env.PROD ? '' : ':3001';
        const wsUrl = `${protocol}//${window.location.hostname}${port}/websocket`;

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            ws.onopen = () => resolve(ws);
            ws.onerror = () => reject(new Error('WebSocket connection failed'));
        });
    }

    setListeners(ws: WebSocket, listeners: EventListeners) {
        const key = this.getKeyByConnection(ws);
        if (key) {
            this.removeListeners(ws);
            this.listeners.set(key, listeners);
            ws.addEventListener('message', listeners.message);
            ws.addEventListener('error', listeners.error);
            ws.addEventListener('close', listeners.close);
        }
    }

    private getKeyByConnection(ws: WebSocket): string | undefined {
        for (const [key, conn] of this.connections.entries()) {
            if (conn === ws) return key;
        }
        return undefined;
    }

    removeListeners(ws: WebSocket) {
        const key = this.getKeyByConnection(ws);
        if (key && this.listeners.has(key)) {
            const listeners = this.listeners.get(key)!;
            ws.removeEventListener('message', listeners.message);
            ws.removeEventListener('error', listeners.error);
            ws.addEventListener('close', listeners.close);
            this.listeners.delete(key);
        }
    }

    async cleanup() {
        // 添加更长的延迟确保所有响应都收到
        await new Promise(resolve => setTimeout(resolve, 3000));

        const currentTime = Date.now();
        for (const [key, ws] of this.connections.entries()) {
            try {
                // 解析连接创建时间
                const timestamp = parseInt(key.split('_').pop() || '0');
                // 只清理超过30秒的连接
                if (currentTime - timestamp > 30000) {
                    if (ws.readyState === WebSocket.OPEN) {
                        this.removeListeners(ws);
                        ws.close();
                    }
                    this.connections.delete(key);
                    console.log('[Execution Pool] 清理连接:', {
                        key,
                        age: (currentTime - timestamp) / 1000,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('[Execution Pool] 清理连接失败:', {
                    key,
                    error,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
}
