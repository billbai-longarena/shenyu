import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '../../../..');

router.post('/save', async (req, res) => {
    try {
        const config = req.body;

        // 验证请求体
        if (!config || !config.defaultLanguage || !['en', 'zh'].includes(config.defaultLanguage)) {
            return res.status(400).json({
                error: {
                    message: 'Invalid language configuration'
                }
            });
        }

        // 保存到 public/language-config.json
        const configPath = path.join(projectRoot, 'public', 'language-config.json');

        // 确保目录存在
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // 写入文件
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        // 等待文件系统同步
        await new Promise(resolve => setTimeout(resolve, 100));

        // 验证文件写入
        const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (written.defaultLanguage !== config.defaultLanguage) {
            throw new Error('File write verification failed');
        }

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json({ success: true });
    } catch (error) {
        console.error('[Language Config] Save error:', error);
        res.status(500).json({
            error: {
                message: 'Failed to save language configuration',
                details: error instanceof Error ? error.message : String(error)
            }
        });
    }
});

export default router;
