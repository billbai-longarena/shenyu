import express from 'express';
import ModelService from '../services/model-service.js';

const router = express.Router();
const modelService = ModelService.getInstance();

router.get('/', (req, res) => {
    try {
        const configs = modelService.getAllConfigs();
        const modelConfigs = Object.entries(configs).reduce((acc, [model, config]) => {
            acc[model] = {
                maxTokens: config.maxTokens,
                temperatureRange: config.temperatureRange
            };
            return acc;
        }, {} as Record<string, any>);

        res.json({
            modelConfigs
        });
    } catch (error) {
        console.error('[Model Config] Error:', error);
        res.status(500).json({
            error: {
                message: 'Failed to get model configurations',
                details: error instanceof Error ? error.message : String(error)
            }
        });
    }
});

export default router;
