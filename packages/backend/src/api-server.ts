import { app, server } from './app.js';

const port = process.env.PORT || 3001;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`WebSocket server available at ws://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default server;
