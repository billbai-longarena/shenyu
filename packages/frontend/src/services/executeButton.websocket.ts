// 从executionPool.ts移动并重命名
import type { ModelType } from '../api/api-deepseekStream.js';

interface EventListeners {
    message: (event: MessageEvent) => void;
    error: (event: Event) => void;
    close: () => void;
}

export class ExecuteButtonWebSocket {
    private static instance: ExecuteButtonWebSocket;
    private connections: Map<string, WebSocket> = new Map();
    private listeners: Map<string, EventListeners> = new Map();
    private activeRequests: Map<string, boolean> = new Map();

    private constructor() { }

    static getInstance(): ExecuteButtonWebSocket {
        if (!ExecuteButtonWebSocket.instance) {
            ExecuteButtonWebSocket.instance = new ExecuteButtonWebSocket();
        }
        return ExecuteButtonWebSocket.instance;
    }

    async getConnection(blockIndex: number, model: ModelType): Promise<WebSocket> {
        const timestamp = Date.now() + 300000; // 5分钟后过期
        const key = `execution_block${blockIndex}_${timestamp}`;
        const ws = await this.createConnection();
        this.connections.set(key, ws);
        this.activeRequests.set(key, true);
        return ws;
    }

    private async createConnection(): Promise<WebSocket> {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = import.meta.env.PROD ? '' : ':3001';
        const wsUrl = `${protocol}//${window.location.hostname}${port}/websocket`;

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            
            let connectionTimeout = setTimeout(() => {
                ws.close();
                reject(new Error('WebSocket connection timeout'));
            }, 5000);

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('[WebSocket] Connection established');
                resolve(ws);
            };

            ws.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('[WebSocket] Connection error:', error);
                reject(new Error('WebSocket connection failed'));
            };

            ws.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log('[WebSocket] Connection closed:', event.code, event.reason);
                if (!ws.onopen) {
                    reject(new Error(`WebSocket connection closed: ${event.code} ${event.reason}`));
                }
            };
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
        // 等待更长时间确保所有响应都收到
        await new Promise(resolve => setTimeout(resolve, 1000));

        const currentTime = Date.now();
        for (const [key, ws] of this.connections.entries()) {
            try {
                // 只清理非活跃且超时的连接
                if (!this.activeRequests.get(key) && currentTime > parseInt(key.split('_').pop() || '0')) {
                    if (ws.readyState === WebSocket.OPEN) {
                        this.removeListeners(ws);
                        ws.close();
                    }
                    this.connections.delete(key);
                    this.activeRequests.delete(key);
                    console.log('[Execute Button WebSocket] 清理连接:', {
                        key,
                        age: (currentTime - parseInt(key.split('_').pop() || '0')) / 1000,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('[Execute Button WebSocket] 清理连接失败:', {
                    key,
                    error,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
}
