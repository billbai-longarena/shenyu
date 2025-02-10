import * as fs from 'fs';
import * as path from 'path';
import { ChatHistory, Message } from '../types/chat.js';

export interface PageHistory {
    storageKey: string;
    histories: ChatHistory[];
}

export interface UserHistories {
    userId: string;
    pages: PageHistory[];
    lastSync: string;
}

export class HistoryService {
    private readonly dataDir = path.join(process.cwd(), 'data', 'histories');

    constructor() {
        // 确保数据目录存在
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * 获取用户历史记录文件路径
     */
    private getUserHistoryPath(userId: string, storageKey: string): string {
        const userDir = path.join(this.dataDir, userId);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        return path.join(userDir, `${storageKey}.json`);
    }

    /**
     * 加载用户历史记录
     */
    async loadHistory(userId: string, storageKey: string): Promise<ChatHistory[]> {
        const filePath = this.getUserHistoryPath(userId, storageKey);
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            const histories = JSON.parse(data);
            return Array.isArray(histories) ? histories : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * 保存用户历史记录
     */
    async saveHistory(userId: string, storageKey: string, histories: ChatHistory[]): Promise<void> {
        const filePath = this.getUserHistoryPath(userId, storageKey);
        await fs.promises.writeFile(
            filePath,
            JSON.stringify(histories, null, 2),
            'utf8'
        );
    }

    /**
     * 删除历史记录
     */
    async deleteHistory(userId: string, storageKey: string, historyId: number): Promise<void> {
        const histories = await this.loadHistory(userId, storageKey);
        const updatedHistories = histories.filter(h => h.id !== historyId);
        await this.saveHistory(userId, storageKey, updatedHistories);
    }

    /**
     * 重命名历史记录
     */
    async renameHistory(
        userId: string,
        storageKey: string,
        historyId: number,
        newTitle: string
    ): Promise<void> {
        const histories = await this.loadHistory(userId, storageKey);
        const history = histories.find(h => h.id === historyId);
        if (history) {
            history.title = newTitle;
            await this.saveHistory(userId, storageKey, histories);
        }
    }

    /**
     * 同步历史记录
     */
    async syncHistory(
        userId: string,
        storageKey: string,
        clientHistories: ChatHistory[]
    ): Promise<{
        histories: ChatHistory[];
        lastSync: string;
    }> {
        const serverHistories = await this.loadHistory(userId, storageKey);

        // 合并历史记录，保持最新记录在前面
        const mergedHistories = this.mergeHistories(serverHistories, clientHistories);

        // 保存合并后的历史记录
        await this.saveHistory(userId, storageKey, mergedHistories);

        return {
            histories: mergedHistories,
            lastSync: new Date().toISOString()
        };
    }

    /**
     * 合并历史记录
     * 处理冲突并保持最新记录在前
     */
    private mergeHistories(serverHistories: ChatHistory[], clientHistories: ChatHistory[]): ChatHistory[] {
        const merged = new Map<number, ChatHistory>();

        // 先添加服务器记录
        for (const history of serverHistories) {
            merged.set(history.id, history);
        }

        // 合并客户端记录，如果ID相同则以客户端为准
        for (const history of clientHistories) {
            merged.set(history.id, history);
        }

        // 转换回数组并按ID降序排序（最新的在前面）
        return Array.from(merged.values()).sort((a, b) => b.id - a.id);
    }

    /**
     * 清除指定用户和storageKey的所有历史记录
     */
    async clearAllHistory(userId: string, storageKey: string): Promise<void> {
        const filePath = this.getUserHistoryPath(userId, storageKey);
        await fs.promises.writeFile(filePath, '[]', 'utf8');
    }

    /**
     * 清理过期历史记录
     */
    async cleanupOldHistories(maxAgeDays: number = 30): Promise<void> {
        const users = await fs.promises.readdir(this.dataDir);
        const now = new Date();

        for (const userId of users) {
            const userDir = path.join(this.dataDir, userId);
            const files = await fs.promises.readdir(userDir);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(userDir, file);
                const stats = await fs.promises.stat(filePath);
                const ageDays = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

                if (ageDays > maxAgeDays) {
                    await fs.promises.unlink(filePath);
                }
            }
        }
    }
}

// 导出单例实例
export const historyService = new HistoryService();
