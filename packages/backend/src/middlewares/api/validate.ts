import { Request, Response, NextFunction } from 'express';
import { ChatRequest, ErrorResponse, Message } from '../../types/api';

function isValidMessage(msg: Message): boolean {
    if (!msg.role || !['system', 'user', 'assistant', 'tool'].includes(msg.role)) {
        return false;
    }

    // 验证content
    if (typeof msg.content === 'string') {
        if (msg.content.trim().length === 0) {
            return false;
        }
    } else if (Array.isArray(msg.content)) {
        if (msg.content.length === 0) {
            return false;
        }
        for (const item of msg.content) {
            if (!item.type || !['text', 'image_url'].includes(item.type)) {
                return false;
            }
            if (item.type === 'text' && (!item.text || item.text.trim().length === 0)) {
                return false;
            }
            if (item.type === 'image_url' && (!item.image_url?.url || item.image_url.url.trim().length === 0)) {
                return false;
            }
        }
    } else {
        return false;
    }

    // 验证tool相关字段
    if (msg.role === 'tool' && !msg.tool_call_id) {
        return false;
    }

    if (msg.tool_calls) {
        if (!Array.isArray(msg.tool_calls) || msg.tool_calls.length === 0) {
            return false;
        }
        for (const tool of msg.tool_calls) {
            if (!tool.id || !tool.type || tool.type !== 'function' ||
                !tool.function?.name || !tool.function?.arguments) {
                return false;
            }
            try {
                JSON.parse(tool.function.arguments);
            } catch {
                return false;
            }
        }
    }

    return true;
}

export function validateRequest(req: Request, res: Response, next: NextFunction) {
    const body = req.body as ChatRequest;

    // 验证基本字段
    if (!body.model || typeof body.model !== 'string' || body.model.trim().length === 0) {
        const errorResponse: ErrorResponse = {
            error: {
                message: 'Invalid model parameter',
                type: 'validation_error',
                code: 'invalid_model'
            }
        };
        res.status(400).json(errorResponse);
        return;
    }

    // 验证messages数组
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
        const errorResponse: ErrorResponse = {
            error: {
                message: 'Messages array is required and cannot be empty',
                type: 'validation_error',
                code: 'invalid_messages'
            }
        };
        res.status(400).json(errorResponse);
        return;
    }

    // 验证每个消息
    for (const msg of body.messages) {
        if (!isValidMessage(msg)) {
            const errorResponse: ErrorResponse = {
                error: {
                    message: 'Invalid message format',
                    type: 'validation_error',
                    code: 'invalid_message_format'
                }
            };
            res.status(400).json(errorResponse);
            return;
        }
    }

    // 验证可选参数
    if (body.temperature !== undefined &&
        (typeof body.temperature !== 'number' ||
            body.temperature < 0 ||
            body.temperature > 2)) {
        const errorResponse: ErrorResponse = {
            error: {
                message: 'Temperature must be a number between 0 and 2',
                type: 'validation_error',
                code: 'invalid_temperature'
            }
        };
        res.status(400).json(errorResponse);
        return;
    }

    if (body.stream !== undefined && typeof body.stream !== 'boolean') {
        const errorResponse: ErrorResponse = {
            error: {
                message: 'Stream must be a boolean',
                type: 'validation_error',
                code: 'invalid_stream'
            }
        };
        res.status(400).json(errorResponse);
        return;
    }

    if (body.stream_options !== undefined) {
        if (typeof body.stream_options !== 'object' ||
            body.stream_options === null ||
            typeof body.stream_options.include_usage !== 'boolean') {
            const errorResponse: ErrorResponse = {
                error: {
                    message: 'Invalid stream_options format',
                    type: 'validation_error',
                    code: 'invalid_stream_options'
                }
            };
            res.status(400).json(errorResponse);
            return;
        }
    }

    next();
}
