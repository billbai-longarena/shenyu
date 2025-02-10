import WebSocket, { WebSocketServer as WSServer, Data } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import AIService from './services/ai-service.js';
import SessionService from './services/session-service.js';
import ModelService from './services/model-service.js';
import { Message, ModelType } from './types/api.js';

interface WebSocketClient extends WebSocket {
    id: string;
    isAlive: boolean;
    currentSessionId?: string;
    isSpeedTest?: boolean;
    upgradeReq?: any;
}

interface StreamRequest {
    type: 'stream';
    model: ModelType;
    messages: Message[];
    temperature: number;
    max_tokens: number;
    mode?: 'speed_test';
}

interface ControlRequest {
    type: 'control';
    action: 'pause' | 'resume' | 'cancel';
    sessionId: string;
}

interface GetClientCountRequest {
    type: 'getClientCount';
}

type WebSocketRequest = StreamRequest | ControlRequest | GetClientCountRequest;

export class WebSocketServer {
    private wss: WSServer;
    private clients: Map<string, WebSocketClient> = new Map();
    private ipToClients: Map<string, Set<string>> = new Map();
    private aiService: AIService;
    private sessionService: SessionService;
    private modelService: ModelService;
    private pingInterval: NodeJS.Timeout | null = null;

    // 请求队列相关
    private requestQueue: {
        client: WebSocketClient;
        request: StreamRequest;
    }[] = [];
    private processingCount = 0;
    private maxConcurrent = 4; // 最大并发数

    constructor(server: any) {
        this.wss = new WSServer({
            server,
            path: '/websocket',
            handleProtocols: (protocols: Set<string>) => {
                return Array.from(protocols)[0] || false;
            },
            verifyClient: ({ req }: { req: any }) => {
                // 保存请求对象以便后续使用
                req.upgradeReq = req;
                return true;
            }
        });
        this.aiService = AIService.getInstance();
        this.sessionService = SessionService.getInstance();
        this.modelService = ModelService.getInstance();

        this.setupWebSocketServer();
        this.setupPingInterval();
    }

    private getClientIp(ws: WebSocket): string {
        const client = ws as WebSocketClient;
        const xForwardedFor = client.upgradeReq?.headers['x-forwarded-for'];

        if (xForwardedFor) {
            return xForwardedFor.split(',')[0].trim();
        }

        const req = (ws as any)._socket?.remoteAddress;
        if (req) {
            return req.replace(/^.*:/, '');
        }

        return '未知IP';
    }

    private cleanupClient(client: WebSocketClient) {
        const clientIp = this.getClientIp(client);

        if (client.currentSessionId) {
            this.sessionService.completeSession(client.currentSessionId);
        }

        this.clients.delete(client.id);

        const clientsForIp = this.ipToClients.get(clientIp);
        if (clientsForIp) {
            clientsForIp.delete(client.id);
            if (clientsForIp.size === 0) {
                this.ipToClients.delete(clientIp);
            }
        }

        if (!client.isSpeedTest) {
            this.broadcastConnectionCount();
        }
    }

    private setupWebSocketServer() {
        this.wss.on('connection', (ws: WebSocket, req: any) => {
            const client = ws as WebSocketClient;
            client.id = uuidv4();
            client.isAlive = true;
            client.isSpeedTest = false;
            client.upgradeReq = req.upgradeReq;

            const clientIp = this.getClientIp(client);
            this.clients.set(client.id, client);

            if (!this.ipToClients.has(clientIp)) {
                this.ipToClients.set(clientIp, new Set());
            }
            this.ipToClients.get(clientIp)!.add(client.id);

            console.log('[WebSocket] 客户端连接:', {
                clientId: client.id,
                ip: clientIp,
                totalClients: this.clients.size,
                uniqueIps: this.ipToClients.size,
                timestamp: new Date().toISOString()
            });

            this.broadcastConnectionCount();

            client.on('pong', () => {
                client.isAlive = true;
            });

            client.on('message', async (data: Data) => {
                try {
                    const request: WebSocketRequest = JSON.parse(data.toString());
                    console.log('[WebSocket] 收到请求:', {
                        clientId: client.id,
                        ip: clientIp,
                        type: request.type,
                        model: (request as StreamRequest).model,
                        timestamp: new Date().toISOString()
                    });
                    await this.handleRequest(client, request);
                } catch (error) {
                    console.error('[WebSocket] 请求处理错误:', {
                        clientId: client.id,
                        ip: clientIp,
                        error,
                        timestamp: new Date().toISOString()
                    });
                    this.sendError(client, 'Invalid request format');
                }
            });

            client.on('close', () => {
                console.log('[WebSocket] 客户端断开连接:', {
                    clientId: client.id,
                    ip: clientIp,
                    remainingClients: this.clients.size,
                    remainingIps: this.ipToClients.size,
                    timestamp: new Date().toISOString()
                });

                this.cleanupClient(client);
            });

            client.on('error', (error) => {
                console.error('[WebSocket] 客户端错误:', {
                    clientId: client.id,
                    ip: clientIp,
                    error,
                    timestamp: new Date().toISOString()
                });
                if (client.currentSessionId) {
                    this.sessionService.setError(client.currentSessionId, error.message);
                }
            });
        });
    }

    private broadcastConnectionCount() {
        const normalClients = new Set<string>();

        this.clients.forEach((client) => {
            if (!client.isSpeedTest) {
                const ip = this.getClientIp(client);
                normalClients.add(ip);
            }
        });

        const count = normalClients.size;

        console.log('[WebSocket] 广播连接数:', {
            uniqueIps: count,
            totalConnections: this.clients.size,
            timestamp: new Date().toISOString()
        });

        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'connectionCount',
                    count: count
                }));
            }
        });
    }

    private setupPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            this.clients.forEach((client) => {
                if (!client.isAlive) {
                    console.log('[WebSocket] 终止非活动客户端:', {
                        clientId: client.id,
                        ip: this.getClientIp(client),
                        timestamp: new Date().toISOString()
                    });
                    client.terminate();
                    this.cleanupClient(client);
                    return;
                }
                client.isAlive = false;
                client.ping();
            });
        }, 30000);
    }

    private processQueue() {
        // 收集可以立即处理的请求
        const requestsToProcess: { client: WebSocketClient; request: StreamRequest }[] = [];

        while (this.requestQueue.length > 0 && this.processingCount < this.maxConcurrent) {
            requestsToProcess.push(this.requestQueue.shift()!);
            this.processingCount++;
        }

        // 并发处理所有收集到的请求
        requestsToProcess.forEach(({ client, request }) => {
            console.log('[Queue] 处理请求:', {
                clientId: client.id,
                model: request.model,
                queueLength: this.requestQueue.length,
                processingCount: this.processingCount,
                timestamp: new Date().toISOString()
            });

            this.handleStreamRequest(client, request)
                .catch(error => {
                    console.error('[Queue] 请求处理错误:', {
                        clientId: client.id,
                        model: request.model,
                        error,
                        timestamp: new Date().toISOString()
                    });
                })
                .finally(() => {
                    this.processingCount--;
                    // 继续处理队列
                    if (this.requestQueue.length > 0) {
                        // 使用setTimeout避免调用栈溢出
                        setTimeout(() => this.processQueue(), 0);
                    }
                });
        });
    }

    private async handleRequest(client: WebSocketClient, request: WebSocketRequest) {
        if (request.type === 'stream') {
            // 将流式请求加入队列
            this.requestQueue.push({ client, request });
            console.log('[Queue] 添加请求:', {
                clientId: client.id,
                model: request.model,
                queueLength: this.requestQueue.length,
                processingCount: this.processingCount,
                timestamp: new Date().toISOString()
            });
            this.processQueue();
        } else if (request.type === 'control') {
            // 控制请求直接处理，不进队列
            await this.handleControlRequest(client, request);
        } else if (request.type === 'getClientCount') {
            // 直接发送当前连接数
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'connectionCount',
                    count: this.getConnectedClientsCount()
                }));
            }
        }
    }

    private async handleStreamRequest(client: WebSocketClient, request: StreamRequest) {
        console.log('[Stream] 开始处理流式请求:', {
            clientId: client.id,
            ip: this.getClientIp(client),
            model: request.model,
            mode: request.mode,
            timestamp: new Date().toISOString()
        });

        let messageSequence = 0;

        // 创建回调处理函数
        const callbacks = {
            onChunk: (chunk: string) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'chunk',
                        content: chunk,
                        sequence: messageSequence++
                    }));
                }
            },
            onError: (error: string) => {
                console.error('[Stream] 请求错误:', {
                    clientId: client.id,
                    model: request.model,
                    error,
                    timestamp: new Date().toISOString()
                });
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'error',
                        content: error,
                        sequence: messageSequence++
                    }));
                }
            },
            onComplete: () => {
                console.log('[Stream] 请求完成:', {
                    clientId: client.id,
                    model: request.model,
                    totalMessages: messageSequence,
                    timestamp: new Date().toISOString()
                });
                // 添加延迟确保所有chunk都已发送
                setTimeout(() => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'complete',
                            sequence: messageSequence++
                        }));
                    }
                }, 1000);
            }
        };

        // 测速模式特殊处理
        if (request.mode === 'speed_test') {
            client.isSpeedTest = true;
            // 测速模式使用特定前缀的ID
            const speedTestSessionId = `speed_test_${request.model}_${Date.now()}`;
            await this.aiService.streamRequest(
                speedTestSessionId,
                request.model,
                request.messages,
                request.temperature,
                request.max_tokens,
                callbacks
            );
            return;
        }

        // 非测速模式创建会话
        const session = this.sessionService.createSession(
            request.model,
            request.temperature,
            request.messages
        );
        client.currentSessionId = session.id;

        // 扩展回调以包含会话管理
        const sessionCallbacks = {
            ...callbacks,
            onError: (error: string) => {
                this.sessionService.setError(session.id, error);
                callbacks.onError(error);
            },
            onComplete: () => {
                this.sessionService.completeSession(session.id);
                callbacks.onComplete();
            }
        };

        await this.aiService.streamRequest(
            session.id,
            request.model,
            request.messages,
            request.temperature,
            request.max_tokens,
            sessionCallbacks
        );
    }

    private async handleControlRequest(client: WebSocketClient, request: ControlRequest) {
        console.log('[Control] 处理控制请求:', {
            clientId: client.id,
            action: request.action,
            sessionId: request.sessionId,
            timestamp: new Date().toISOString()
        });

        const session = this.sessionService.getSession(request.sessionId);
        if (!session) {
            console.error('[Control] 会话未找到:', {
                clientId: client.id,
                sessionId: request.sessionId,
                timestamp: new Date().toISOString()
            });
            this.sendError(client, 'Session not found');
            return;
        }

        switch (request.action) {
            case 'pause':
                this.sessionService.pauseSession(request.sessionId);
                client.send(JSON.stringify({ type: 'control', action: 'paused' }));
                break;
            case 'resume':
                this.sessionService.resumeSession(request.sessionId);
                client.send(JSON.stringify({ type: 'control', action: 'resumed' }));
                break;
            case 'cancel':
                this.sessionService.completeSession(request.sessionId);
                client.send(JSON.stringify({ type: 'control', action: 'cancelled' }));
                break;
        }
    }

    private sendError(client: WebSocketClient, message: string) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'error', message }));
        }
    }

    public getConnectedClientsCount(): number {
        const normalClients = new Set<string>();

        this.clients.forEach((client) => {
            if (!client.isSpeedTest) {
                const ip = this.getClientIp(client);
                normalClients.add(ip);
            }
        });

        return normalClients.size;
    }

    public close() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        this.wss.close();
    }
}

export default WebSocketServer;
