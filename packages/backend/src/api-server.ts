import { app, server } from './app.js';

const port = process.env.PORT || 3001;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`WebSocket server available at ws://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// 优雅关闭
const gracefulShutdown = () => {
    console.log('Closing server...');
    // 获取WebSocket服务器实例
    const wss = app.get('wss');
    if (wss) {
        // 关闭所有WebSocket连接
        wss.close(() => {
            console.log('WebSocket server closed');
            // 关闭HTTP服务器
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });
    } else {
        // 如果没有WebSocket服务器，直接关闭HTTP服务器
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    }
};

// 处理终止信号
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default server;
