import express from 'express';
import WebSocketServer from '../websocket.js';

const router = express.Router();

router.get('/', (req, res) => {
    const wss = req.app.get('wss') as WebSocketServer;
    res.json({
        count: wss.getConnectedClientsCount()
    });
});

export default router;
