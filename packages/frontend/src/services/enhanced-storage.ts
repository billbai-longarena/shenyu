import { ref, watch } from 'vue';
import type { ChatHistory } from '../types/chat';
import { localStorageService } from './storage';
import { apiHistoryService } from './api-history';
import { collectBrowserFingerprint } from './user-identity';

export class EnhancedStorageService {
    private userId: string | null = null;
    private syncing = ref(false);
    private lastSync = ref<string | null>(null);
    private error = ref<string | null>(null);

    /**
     * 初始化服务
     */
    async initialize(): Promise<void> {
        try {
            const fingerprint = await collectBrowserFingerprint();
            this.userId = await apiHistoryService.identifyUser(fingerprint);
        } catch (error) {
            console.error('Failed to initialize storage service:', error);
            this.error.value = 'Failed to initialize storage service';
        }
    }

    /**
     * 加载历史记录
     */
    async loadHistory(key: string): Promise<ChatHistory[]> {
        // 首先加载本地数据
        const localHistories = localStorageService.loadHistory(key);

        // 如果没有初始化成功，返回本地数据
        if (!this.userId) {
            return localHistories;
        }

        try {
            this.syncing.value = true;
            // 从服务器加载数据并合并
            const serverHistories = await apiHistoryService.loadHistory(key);
            const mergedHistories = this.mergeHistories(localHistories, serverHistories);

            // 保存合并后的数据到本地
            localStorageService.saveHistory(mergedHistories, key);

            this.lastSync.value = new Date().toISOString();
            return mergedHistories;
        } catch (error) {
            console.error('Failed to load history from server:', error);
            this.error.value = 'Failed to load history from server';
            return localHistories;
        } finally {
            this.syncing.value = false;
        }
    }

    /**
     * 保存历史记录
     */
    async saveHistory(histories: ChatHistory[], key: string): Promise<void> {
        // 保存到本地
        localStorageService.saveHistory(histories, key);

        // 如果没有初始化成功，只保存本地
        if (!this.userId) {
            return;
        }

        try {
            this.syncing.value = true;
            // 同步到服务器
            await apiHistoryService.saveHistory(histories, key);
            this.lastSync.value = new Date().toISOString();
        } catch (error) {
            console.error('Failed to save history to server:', error);
            this.error.value = 'Failed to save history to server';
        } finally {
            this.syncing.value = false;
        }
    }

    /**
     * 删除历史记录
     */
    async deleteHistory(historyId: number, key: string): Promise<void> {
        // 从本地删除
        const histories = localStorageService.loadHistory(key);
        const updatedHistories = histories.filter(h => h.id !== historyId);
        localStorageService.saveHistory(updatedHistories, key);

        // 如果没有初始化成功，只删除本地
        if (!this.userId) {
            return;
        }

        try {
            this.syncing.value = true;
            // 从服务器删除
            await apiHistoryService.deleteHistory(historyId, key);
            this.lastSync.value = new Date().toISOString();
        } catch (error) {
            console.error('Failed to delete history from server:', error);
            this.error.value = 'Failed to delete history from server';
        } finally {
            this.syncing.value = false;
        }
    }

    /**
     * 重命名历史记录
     */
    async renameHistory(historyId: number, newTitle: string, key: string): Promise<void> {
        // 在本地重命名
        const histories = localStorageService.loadHistory(key);
        const history = histories.find(h => h.id === historyId);
        if (history) {
            history.title = newTitle;
            localStorageService.saveHistory(histories, key);
        }

        // 如果没有初始化成功，只重命名本地
        if (!this.userId) {
            return;
        }

        try {
            this.syncing.value = true;
            // 在服务器重命名
            await apiHistoryService.renameHistory(historyId, newTitle, key);
            this.lastSync.value = new Date().toISOString();
        } catch (error) {
            console.error('Failed to rename history on server:', error);
            this.error.value = 'Failed to rename history on server';
        } finally {
            this.syncing.value = false;
        }
    }

    /**
     * 清除所有历史记录
     */
    async clearAllHistory(key: string): Promise<void> {
        // 清除本地存储
        localStorageService.saveHistory([], key);

        // 如果没有初始化成功，只清除本地
        if (!this.userId) {
            return;
        }

        try {
            this.syncing.value = true;
            // 清除服务器存储
            await apiHistoryService.clearAllHistory(key);
            this.lastSync.value = new Date().toISOString();
        } catch (error) {
            console.error('Failed to clear all history on server:', error);
            this.error.value = 'Failed to clear all history on server';
        } finally {
            this.syncing.value = false;
        }
    }

    /**
     * 合并历史记录
     */
    private mergeHistories(local: ChatHistory[], server: ChatHistory[]): ChatHistory[] {
        const merged = new Map<number, ChatHistory>();

        // 先添加本地记录
        for (const history of local) {
            merged.set(history.id, history);
        }

        // 合并服务器记录，如果ID相同则保留较新的版本
        for (const history of server) {
            const existing = merged.get(history.id);
            if (!existing || this.isNewer(history, existing)) {
                merged.set(history.id, history);
            }
        }

        // 转换回数组并按ID降序排序（最新的在前面）
        return Array.from(merged.values()).sort((a, b) => b.id - a.id);
    }

    /**
     * 判断历史记录是否较新
     */
    private isNewer(a: ChatHistory, b: ChatHistory): boolean {
        // 使用ID作为时间戳比较（因为ID是使用Date.now()生成的）
        return a.id > b.id;
    }

    /**
     * 获取同步状态
     */
    getStatus() {
        return {
            syncing: this.syncing,
            lastSync: this.lastSync,
            error: this.error,
            isInitialized: !!this.userId
        };
    }
}

// 导出单例实例
export const enhancedStorageService = new EnhancedStorageService();
