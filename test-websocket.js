import WebSocket from 'ws';
import { setTimeout } from 'timers/promises';

async function testWebSocket() {
    const ws = new WebSocket('ws://localhost:3001/websocket');

    ws.on('open', () => {
        console.log('连接成功');

        // 发送测试请求
        const request = {
            type: 'stream',
            model: 'kimi',
            messages: [{ role: 'user', content: '写一个小说，主题随意' }],
            temperature: 0.7,
            max_tokens: 1000
        };

        ws.send(JSON.stringify(request));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data.toString());

        switch (response.type) {
            case 'chunk':
                console.log('收到内容:', response.content);
                break;
            case 'error':
                console.error('错误:', response.message);
                break;
            case 'complete':
                console.log('请求完成');
                ws.close();
                break;
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
    });

    ws.on('close', () => {
        console.log('连接关闭');
    });

    // 60秒超时保护
    await setTimeout(60000);
    if (ws.readyState === WebSocket.OPEN) {
        console.log('测试超时，关闭连接');
        ws.close();
    }
}

testWebSocket().catch(console.error);
