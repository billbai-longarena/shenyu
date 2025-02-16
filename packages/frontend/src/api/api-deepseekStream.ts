import type { Message } from '../types/chat';

export type ModelType = 'deepseek' | 'kimi' | 'yiwan' | 'siliconDeepseek' | 'baiduDeepseek' | 'qwen-turbo-latest' | 'alideepseekv3' | 'alideepseekr1' | 'volcesDeepseek' | 'volcesDeepseekR1' | 'tencentDeepseek' | 'minimax-text';

import { SpeedTestButtonWebSocket } from '../services/speedTestButton.websocket.js';
import { ExecuteButtonWebSocket } from '../services/executeButton.websocket.js';
import { useModelConfig } from '../composables/useModelConfig';

let currentModel: ModelType = 'kimi';
const { getModelMaxTokens } = useModelConfig();
let currentTemperature: number = 0.7;

export function getCurrentModel(): ModelType {
    return currentModel;
}

export function setTemperature(temp: number) {
    currentTemperature = temp;
}

export function setModel(model: ModelType) {
    currentModel = model;
}

interface StreamMessage {
    type: 'chunk' | 'complete' | 'error' | 'connectionCount';
    content?: string;
    sequence?: number;
    count?: number;  // for connectionCount type
}

export async function RequestAI(
    model: ModelType,
    prompt: string,
    onChunk: (chunk: string) => void,
    mode?: 'speed_test'
): Promise<void> {
    let messageSequence = 0;
    let receivedSequence = 0;
    console.log('[RequestAI] 开始请求:', {
        model,
        mode,
        promptLength: prompt.length,
        tokensEstimate: Math.ceil(prompt.length / 4),
        timestamp: new Date().toISOString()
    });

    let ws: WebSocket | null = null;
    const pool = mode === 'speed_test' ? SpeedTestButtonWebSocket.getInstance() : ExecuteButtonWebSocket.getInstance();

    try {
        // 重试机制
        let retries = 3;
        while (retries > 0) {
            try {
                // 根据模式获取不同的连接
                ws = mode === 'speed_test'
                    ? await (pool as SpeedTestButtonWebSocket).getConnection(0, model) // 测速模式使用block 0
                    : await (pool as ExecuteButtonWebSocket).getConnection(0, model); // 执行模式使用block 0

                return new Promise(async (resolve, reject) => {
                    if (!ws) {
                        reject(new Error('WebSocket connection not available'));
                        return;
                    }

                    let messages: Message[] = [];

                    // 对于 minimax-text 模型，添加特殊的 system 消息和 name 字段
                    if (model === 'minimax-text') {
                        messages = [
                            {
                                role: 'system',
                                name: 'MM智能助理',
                                content: 'MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。'
                            },
                            {
                                role: 'user',
                                name: '用户',
                                content: prompt
                            }
                        ];
                    } else {
                        messages = [
                            { role: 'user', content: prompt }
                        ];
                    }

                    // 获取max_tokens
                    const max_tokens = await getModelMaxTokens(model);

                    // 创建新的事件监听器
                    const handleMessage = (event: MessageEvent) => {
                        try {
                            const response = JSON.parse(event.data) as StreamMessage;
                            if (response.type !== 'connectionCount') {
                                console.log('[WebSocket] 收到消息:', {
                                    type: response.type,
                                    sequence: response.sequence,
                                    contentLength: response.content?.length,
                                    model,
                                    timestamp: new Date().toISOString()
                                });

                                // 验证消息序列
                                if (response.sequence !== undefined && response.sequence !== receivedSequence++) {
                                    console.warn('[WebSocket] 消息序列不匹配:', {
                                        expected: receivedSequence - 1,
                                        received: response.sequence
                                    });
                                }
                            }

                            switch (response.type) {
                                case 'chunk':
                                    onChunk(response.content || '');
                                    break;
                                case 'error':
                                    const errorMsg = response.content || 'Unknown error';
                                    console.error('[WebSocket] 错误响应:', {
                                        error: errorMsg,
                                        model,
                                        timestamp: new Date().toISOString()
                                    });

                                    // 解析错误信息
                                    let displayError = errorMsg;
                                    try {
                                        const errorObj = JSON.parse(errorMsg);
                                        if (errorObj.error?.message) {
                                            displayError = errorObj.error.message;
                                        }
                                    } catch (e) {
                                        // 如果不是JSON格式，使用原始错误信息
                                    }

                                    onChunk(`[ERROR] ${displayError}`);
                                    reject(new Error(displayError));
                                    break;
                                case 'complete':
                                    // 添加延迟确保所有chunk都已处理
                                    setTimeout(() => {
                                        console.log('[WebSocket] 请求完成:', {
                                            model,
                                            temperature: currentTemperature,
                                            totalMessages: receivedSequence,
                                            timestamp: new Date().toISOString()
                                        });
                                        onChunk('[DONE]');
                                        resolve();
                                    }, 200);
                                    break;
                            }
                        } catch (error) {
                            console.error('Error parsing WebSocket message:', error);
                            onChunk('[ERROR] Failed to parse server response');
                            reject(error);
                        }
                    };

                    const handleError = (error: Event) => {
                        console.error('WebSocket error:', error);
                        onChunk('[ERROR] WebSocket connection error');
                        reject(new Error('WebSocket connection error'));
                    };

                    const handleClose = () => {
                        if (ws) {
                            pool.removeListeners(ws);
                        }
                    };

                    // 设置事件监听器
                    const listeners = {
                        message: handleMessage,
                        error: handleError,
                        close: handleClose
                    };
                    pool.setListeners(ws!, listeners);

                    // 设置5分钟超时
                    const timeout = setTimeout(() => {
                        reject(new Error('Request timeout'));
                    }, 300000);

                    // 发送请求
                    const request = {
                        type: 'stream',
                        model,
                        messages,
                        temperature: currentTemperature,
                        max_tokens,
                        mode,
                        sequence: messageSequence++
                    };

                    console.log('[WebSocket] 发送请求:', {
                        model,
                        mode,
                        maxTokens: max_tokens,
                        timestamp: new Date().toISOString()
                    });

                    ws.send(JSON.stringify(request));
                });
            } catch (error) {
                retries--;
                if (retries === 0) {
                    throw error;
                }
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            break;
        }
    } catch (error) {
        console.error('Error in RequestAI:', error);
        throw error;
    } finally {
        // 清理连接
        if (ws) {
            await pool.cleanup();
        }
        console.log('Request Ended:', {
            model,
            mode,
            timestamp: new Date().toISOString()
        });
    }
}
