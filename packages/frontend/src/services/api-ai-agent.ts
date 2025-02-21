import { collectBrowserFingerprint } from './user-identity';

class ApiAIAgentService {
    private baseUrl = '/api';
    private userId: string | null = null;

    /**
     * 初始化服务
     */
    async initialize(): Promise<void> {
        try {
            const fingerprint = await collectBrowserFingerprint();
            const response = await fetch(`${this.baseUrl}/user/identify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fingerprint }),
            });

            if (!response.ok) {
                throw new Error('Failed to identify user');
            }

            const data = await response.json();
            this.userId = data.userId;
        } catch (error) {
            console.error('Failed to initialize AI agent service:', error);
            throw error;
        }
    }

    /**
     * 保存AI Agent配置
     */
    async saveAgent(content: string, path: string, model: string, temperature: number): Promise<void> {
        if (!this.userId) {
            throw new Error('User not identified');
        }

        // 提取JSON字符串并解析
        const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g;
        const matches = path.match(jsonRegex);
        if (!matches) {
            throw new Error('Invalid path format');
        }
        const cleanedJson = matches[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/\n\s*\n/g, '\n').trim();
        const pathConfig = JSON.parse(cleanedJson);

        const response = await fetch(`${this.baseUrl}/ai-agent/${this.userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                path: pathConfig,
                model,
                temperature
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save AI agent');
        }
    }
}

// 导出单例实例
export const apiAIAgentService = new ApiAIAgentService();
