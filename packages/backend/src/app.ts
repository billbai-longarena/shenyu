import express from 'express';
import cors from 'cors';
import http from 'node:http';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import WebSocketServer from './websocket.js';
import ModelService from './services/model-service.js';
import SessionService from './services/session-service.js';
import clientCountRouter from './routes/clientCount.js';
import modelConfigRouter from './routes/model-config.js';
import userHistoryRouter from './routes/user-history.js';

// 加载环境变量
const envPath = join(__dirname, '../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
} else {
    console.log('Environment variables loaded:', {
        KIMI_API_KEY: process.env.KIMI_API_KEY ? 'exists' : 'missing'
    });
}

// 重新初始化ModelService以确保它使用新的环境变量
const modelService = ModelService.getInstance();
modelService.reloadConfig();

const app = express();
const server = http.createServer(app);

// 初始化WebSocket服务器
const wss = new WebSocketServer(server);

// 设置WebSocket服务器实例到app
app.set('wss', wss);

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 路由配置
app.use('/api/client-count', clientCountRouter);
app.use('/api/model-config', modelConfigRouter);
app.use('/api', userHistoryRouter);  // 用户历史记录路由

// 基础健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        connections: wss.getConnectedClientsCount()
    });
});

// 获取服务状态
app.get('/status', (req, res) => {
    const sessionService = SessionService.getInstance();
    const modelService = ModelService.getInstance();

    res.json({
        server: {
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            connections: wss.getConnectedClientsCount()
        },
        sessions: sessionService.getStats(),
        models: Object.keys(modelService.getAllConfigs()).map(model => ({
            name: model,
            config: modelService.getConfig(model as any)
        }))
    });
});

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: {
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
});

export { app, server };
