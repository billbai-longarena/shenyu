// 测试聊天API
const fetch = require('node-fetch');

const API_KEY = 'sk-cline-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const API_URL = 'http://localhost:3002/api/v1/chat/completions';

async function testChat() {
    console.log('发送请求到:', API_URL);
    console.log('使用模型:', 'deepseek-v3');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-v3',
                messages: [
                    {
                        role: 'user',
                        content: '你好，请介绍一下自己。'
                    }
                ],
                stream: true,
                temperature: 0.7,
                stream_options: {
                    include_usage: true
                }
            })
        });

        console.log('收到响应状态:', response.status);

        if (!response.ok) {
            const error = await response.json();
            console.error('API错误:', error);
            return;
        }

        // 创建文本解码器
        const decoder = new TextDecoder();
        let buffer = '';

        // 获取响应流
        const reader = response.body;
        reader.on('data', (chunk) => {
            // 将新的数据添加到缓冲区
            buffer += decoder.decode(chunk, { stream: true });

            // 处理缓冲区中的所有完整行
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个不完整的行

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        console.log('\n流式响应结束');
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices?.[0]?.delta?.content) {
                            process.stdout.write(parsed.choices[0].delta.content);
                        }
                        if (parsed.usage) {
                            console.log('\nToken使用统计:', parsed.usage);
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        });

        reader.on('end', () => {
            // 处理缓冲区中的剩余数据
            if (buffer) {
                const lines = buffer.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data !== '[DONE]') {
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.choices?.[0]?.delta?.content) {
                                    process.stdout.write(parsed.choices[0].delta.content);
                                }
                                if (parsed.usage) {
                                    console.log('\nToken使用统计:', parsed.usage);
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                }
            }
            console.log('\n响应完成');
        });

    } catch (error) {
        console.error('请求错误:', error.message);
        if (error.stack) {
            console.error('错误堆栈:', error.stack);
        }
    }
}

console.log('开始测试聊天API...\n');
testChat().catch(console.error);
