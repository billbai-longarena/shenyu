import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    ChatRequest,
    ChatResponse,
    ErrorResponse,
    StreamResponse,
    Message
} from '../../types/api';

// 计算token数量（简单估算）
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// 处理消息内容
function getMessageContent(msg: Message): string {
    if (typeof msg.content === 'string') {
        return msg.content;
    } else if (Array.isArray(msg.content)) {
        return msg.content
            .map(item => {
                if (item.type === 'text') return item.text;
                // 目前不支持图片，忽略image_url类型
                return '';
            })
            .join('');
    }
    return '';
}

export async function handleRequest(req: Request, res: Response) {
    const request = req.body as ChatRequest;
    const isStream = request.stream ?? true;

    try {
        // 设置SSE头部
        if (isStream) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }

        // 计算输入tokens
        const promptTokens = estimateTokens(request.messages.map(m => getMessageContent(m)).join(''));

        // 这里应该调用实际的AI服务API
        // 目前返回一个示例响应
        if (isStream) {
            const streamResponse: StreamResponse = {
                choices: [{
                    delta: {
                        content: "This is a placeholder response. Please implement actual AI service integration."
                    }
                }]
            };

            res.write(`data: ${JSON.stringify(streamResponse)}\n\n`);

            if (request.stream_options?.include_usage) {
                const usage = {
                    prompt_tokens: promptTokens,
                    completion_tokens: estimateTokens("This is a placeholder response")
                };
                res.write(`data: ${JSON.stringify({ usage })}\n\n`);
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            const content = "This is a placeholder response. Please implement actual AI service integration.";
            const chatResponse: ChatResponse = {
                id: uuidv4(),
                choices: [{
                    message: {
                        role: 'assistant',
                        content: content
                    },
                    finish_reason: 'stop'
                }],
                usage: {
                    prompt_tokens: promptTokens,
                    completion_tokens: estimateTokens(content)
                }
            };
            res.json(chatResponse);
        }
    } catch (error) {
        console.error('API Error:', error);
        const errorResponse: ErrorResponse = {
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                type: 'api_error',
                code: 'request_failed'
            }
        };

        if (!res.headersSent) {
            res.status(500).json(errorResponse);
        } else {
            res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
            res.end();
        }
    }
}
