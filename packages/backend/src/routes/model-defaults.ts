import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const stat = promisify(fs.stat);

// 调试日志中间件
router.use((req, res, next) => {
    console.log('\n[Model Defaults] ====== 请求开始 ======');
    console.log(`[Model Defaults] ${req.method} ${req.path}`);
    console.log('[Model Defaults] 请求头:', JSON.stringify(req.headers, null, 2));
    console.log('[Model Defaults] 请求体:', JSON.stringify(req.body, null, 2));
    console.log('[Model Defaults] 查询参数:', JSON.stringify(req.query, null, 2));
    console.log(`[Model Defaults] 当前工作目录: ${process.cwd()}`);
    console.log(`[Model Defaults] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[Model Defaults] __dirname: ${__dirname}`);
    next();
});

// 保存默认配置
router.post('/save', async (req, res) => {
    console.log('\n[Model Defaults] ====== 开始处理保存请求 ======');
    console.log('[Model Defaults] 收到保存请求体:', JSON.stringify(req.body, null, 2));

    try {
        const { defaultModel, defaultTemperature, lastUpdated } = req.body;
        console.log('[Model Defaults] 解析的数据:', { defaultModel, defaultTemperature, lastUpdated });

        // 输入验证
        if (!defaultModel || typeof defaultTemperature !== 'number' || !lastUpdated) {
            console.error('[Model Defaults] 输入验证失败:', { defaultModel, defaultTemperature, lastUpdated });
            return res.status(400).json({
                error: {
                    message: '无效的配置数据',
                    details: {
                        defaultModel: defaultModel ? '有效' : '无效或缺失',
                        defaultTemperature: typeof defaultTemperature === 'number' ? '有效' : '无效或缺失',
                        lastUpdated: lastUpdated ? '有效' : '无效或缺失'
                    }
                }
            });
        }

        // 环境信息日志
        console.log('\n[Model Defaults] ====== 环境信息 ======');
        console.log('[Model Defaults] 环境变量:', {
            NODE_ENV: process.env.NODE_ENV,
            PWD: process.cwd(),
            __dirname: __dirname
        });

        // 路径解析
        const rootDir = path.resolve(__dirname, '../../../..');  // 从当前文件位置向上4级到达项目根目录
        const publicPath = path.join(rootDir, 'packages/frontend/public');
        const configPath = path.join(publicPath, 'model-defaults.json');

        console.log('\n[Model Defaults] ====== 路径信息 ======');
        console.log('[Model Defaults] Public目录:', publicPath);
        console.log('[Model Defaults] 配置文件路径:', configPath);

        // 目录检查
        const dirPath = path.dirname(configPath);
        console.log('\n[Model Defaults] ====== 目录检查 ======');
        console.log('[Model Defaults] 目标目录路径:', dirPath);

        try {
            // 检查和创建目录
            const dirExists = fs.existsSync(publicPath);
            console.log(`[Model Defaults] 目录 ${publicPath} 是否存在:`, dirExists);

            if (!dirExists) {
                await mkdir(publicPath, { recursive: true });
                console.log(`[Model Defaults] 已创建目录: ${publicPath}`);
            }

            // 检查目录权限
            await access(publicPath, fs.constants.W_OK);
            const dirStats = await stat(publicPath);
            console.log(`[Model Defaults] 目录权限:`, dirStats.mode.toString(8));
            console.log('[Model Defaults] 目录权限检查通过');
        } catch (mkdirError) {
            console.error('[Model Defaults] 目录操作失败:', mkdirError);
            const errorMessage = mkdirError instanceof Error ? mkdirError.message : String(mkdirError);
            throw new Error(`目录操作失败: ${errorMessage}`);
        }

        // 如果文件已存在，先读取当前内容
        console.log('\n[Model Defaults] ====== 文件操作 ======');
        if (fs.existsSync(configPath)) {
            try {
                const currentContent = await readFile(configPath, 'utf8');
                console.log('[Model Defaults] 当前文件内容:', currentContent);
            } catch (readError) {
                console.warn('[Model Defaults] 读取当前文件失败:', readError);
            }
        } else {
            console.log('[Model Defaults] 文件不存在，将创建新文件');
        }

        // 准备写入的配置内容
        const configContent = JSON.stringify({
            defaultModel,
            defaultTemperature,
            lastUpdated
        }, null, 4);
        console.log('[Model Defaults] 准备写入的配置内容:', configContent);

        // 写入配置文件
        try {
            // 写入配置文件
            await writeFile(configPath, configContent);
            console.log('[Model Defaults] 文件写入成功');

            // 验证写入
            const writtenContent = await readFile(configPath, 'utf8');
            console.log('[Model Defaults] 验证写入的内容:', writtenContent);

            if (writtenContent.trim() !== configContent.trim()) {
                throw new Error('文件内容验证失败');
            }

            // 检查文件权限
            const fileStats = await stat(configPath);
            console.log('[Model Defaults] 文件权限:', fileStats.mode.toString(8));
            console.log('[Model Defaults] 文件所有者:', fileStats.uid, '组:', fileStats.gid);

            console.log('[Model Defaults] 文件内容验证通过');
        } catch (writeError) {
            console.error('[Model Defaults] 写入文件失败:', writeError);
            const errorMessage = writeError instanceof Error ? writeError.message : String(writeError);
            throw new Error(`写入文件失败: ${errorMessage}`);
        }

        console.log('[Model Defaults] 配置已成功保存到:', configPath);
        res.json({
            message: '配置已保存',
            path: configPath,
            content: configContent
        });

        console.log('[Model Defaults] ====== 请求处理完成 ======\n');
    } catch (error) {
        console.error('[Model Defaults] 处理请求失败:', error);
        if (error instanceof Error) {
            console.error('[Model Defaults] 错误堆栈:', error.stack);
        }
        res.status(500).json({
            error: {
                message: '保存配置失败',
                details: error instanceof Error ? error.message : String(error)
            }
        });
        console.log('[Model Defaults] ====== 请求处理失败 ======\n');
    }
});

export default router;
