import { Router } from 'express';
import { authMiddleware } from '../middlewares/api/auth';
import { validateRequest } from '../middlewares/api/validate';
import { handleRequest } from '../middlewares/api/handler';

const router = Router();

// 添加聊天完成接口
router.post('/v1/chat/completions', authMiddleware, validateRequest, handleRequest);

export default router;
