import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../../types/api';

const API_KEY = 'sk-cline-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        const errorResponse: ErrorResponse = {
            error: {
                message: 'Missing Authorization header',
                type: 'authentication_error',
                code: 'auth_required'
            }
        };
        res.status(401).json(errorResponse);
        return;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
        const errorResponse: ErrorResponse = {
            error: {
                message: 'Invalid Authorization header format',
                type: 'authentication_error',
                code: 'invalid_auth_format'
            }
        };
        res.status(401).json(errorResponse);
        return;
    }

    if (token !== API_KEY) {
        const errorResponse: ErrorResponse = {
            error: {
                message: 'Invalid API key',
                type: 'authentication_error',
                code: 'invalid_api_key'
            }
        };
        res.status(401).json(errorResponse);
        return;
    }

    next();
}
