import { Router } from 'express';
import { userIdentityService } from '../services/user-identity-service.js';
import { historyService } from '../services/history-service.js';
import type { BrowserFingerprint } from '../services/user-identity-service';
import type { ChatHistory } from '../types/chat';

const router = Router();

/**
 * 用户识别
 * POST /api/user/identify
 */
router.post('/user/identify', async (req, res) => {
    try {
        const fingerprint: BrowserFingerprint = req.body.fingerprint;
        const result = await userIdentityService.identifyUser(fingerprint, req);
        res.json(result);
    } catch (error) {
        console.error('User identification error:', error);
        res.status(500).json({ error: 'Failed to identify user' });
    }
});

/**
 * 获取历史记录
 * GET /api/history/:userId/:storageKey
 */
router.get('/history/:userId/:storageKey', async (req, res) => {
    try {
        const { userId, storageKey } = req.params;
        const histories = await historyService.loadHistory(userId, storageKey);
        res.json({
            histories,
            lastSync: new Date().toISOString()
        });
    } catch (error) {
        console.error('Load history error:', error);
        res.status(500).json({ error: 'Failed to load history' });
    }
});

/**
 * 保存历史记录
 * POST /api/history/:userId/:storageKey
 */
router.post('/history/:userId/:storageKey', async (req, res) => {
    try {
        const { userId, storageKey } = req.params;
        const histories: ChatHistory[] = req.body.histories;
        await historyService.saveHistory(userId, storageKey, histories);
        res.json({ success: true });
    } catch (error) {
        console.error('Save history error:', error);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

/**
 * 同步历史记录
 * PUT /api/history/:userId/:storageKey/sync
 */
router.put('/history/:userId/:storageKey/sync', async (req, res) => {
    try {
        const { userId, storageKey } = req.params;
        const clientHistories: ChatHistory[] = req.body.histories;
        const result = await historyService.syncHistory(userId, storageKey, clientHistories);
        res.json(result);
    } catch (error) {
        console.error('Sync history error:', error);
        res.status(500).json({ error: 'Failed to sync history' });
    }
});

/**
 * 删除历史记录
 * DELETE /api/history/:userId/:storageKey/:historyId
 */
router.delete('/history/:userId/:storageKey/:historyId', async (req, res) => {
    try {
        const { userId, storageKey, historyId } = req.params;
        await historyService.deleteHistory(userId, storageKey, parseInt(historyId));
        res.json({ success: true });
    } catch (error) {
        console.error('Delete history error:', error);
        res.status(500).json({ error: 'Failed to delete history' });
    }
});

/**
 * 重命名历史记录
 * PUT /api/history/:userId/:storageKey/:historyId/rename
 */
router.put('/history/:userId/:storageKey/:historyId/rename', async (req, res) => {
    try {
        const { userId, storageKey, historyId } = req.params;
        const { title } = req.body;
        await historyService.renameHistory(userId, storageKey, parseInt(historyId), title);
        res.json({ success: true });
    } catch (error) {
        console.error('Rename history error:', error);
        res.status(500).json({ error: 'Failed to rename history' });
    }
});

/**
 * 清除所有历史记录
 * DELETE /api/history/:userId/:storageKey/all
 */
router.delete('/history/:userId/:storageKey/all', async (req, res) => {
    try {
        const { userId, storageKey } = req.params;
        await historyService.clearAllHistory(userId, storageKey);
        res.json({ success: true });
    } catch (error) {
        console.error('Clear all history error:', error);
        res.status(500).json({ error: 'Failed to clear all history' });
    }
});

export default router;
