import * as fs from 'fs';
import * as path from 'path';

export interface AIAgentData {
    content: string;
    path: {
        adminInputs: { [key: string]: string };
        promptBlocks: { [key: string]: string };
    };
    model: string;
    temperature: number;
    timestamp: string;
}

export class AIAgentService {
    private readonly dataDir = path.join(process.cwd(), 'data', 'ai-agents');

    constructor() {
        // 确保数据目录存在
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * 保存AI Agent配置
     */
    async saveAgent(userId: string, data: AIAgentData): Promise<void> {
        const filePath = path.join(this.dataDir, `${userId}_${Date.now()}.json`);
        await fs.promises.writeFile(
            filePath,
            JSON.stringify(data, null, 2),
            'utf8'
        );
    }
}

// 导出单例实例
export const aiAgentService = new AIAgentService();
