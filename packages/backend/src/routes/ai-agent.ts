import express from 'express';
import { aiAgentService } from '../services/ai-agent-service.js';

const router = express.Router();

/**
 * 保存AI Agent配置
 */
router.post('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { content, path, model, temperature } = req.body;

        await aiAgentService.saveAgent(userId, {
            content,
            path,
            model,
            temperature,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Failed to save AI agent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save AI agent'
        });
    }
});

export default router;
