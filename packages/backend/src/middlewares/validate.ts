import { Request, Response, NextFunction } from 'express';

export function validateTencentRequest(req: Request, res: Response, next: NextFunction) {
    const { model, messages, max_tokens } = req.body;

    if (!model || typeof model !== 'string') {
        res.status(400).json({
            error: {
                message: 'Invalid model parameter'
            }
        });
        return;
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({
            error: {
                message: 'Invalid messages parameter'
            }
        });
        return;
    }

    for (const msg of messages) {
        if (!msg.role || !msg.content || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
            res.status(400).json({
                error: {
                    message: 'Invalid message format'
                }
            });
            return;
        }
    }

    if (!max_tokens || typeof max_tokens !== 'number' || max_tokens <= 0) {
        res.status(400).json({
            error: {
                message: 'Invalid max_tokens parameter'
            }
        });
        return;
    }

    next();
}
