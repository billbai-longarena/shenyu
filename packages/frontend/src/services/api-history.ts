import type { ChatHistory } from '../types/chat';
import type { BrowserFingerprint } from './user-identity.js';

export interface IdentifyResponse {
    userId: string;
    isNewUser: boolean;
}

export interface SyncResponse {
    histories: ChatHistory[];
    lastSync: string;
}

class ApiHistoryService {
    private userId: string | null = null;
    private baseUrl = '/api';

    /**
     * 识别用户
     */
    async identifyUser(fingerprint: BrowserFingerprint): Promise<string> {
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

        const data: IdentifyResponse = await response.json();
        this.userId = data.userId;
        return data.userId;
    }

    /**
     * 加载历史记录
     */
    async loadHistory(storageKey: string): Promise<ChatHistory[]> {
        if (!this.userId) {
            throw new Error('User not identified');
        }

        const response = await fetch(
            `${this.baseUrl}/history/${this.userId}/${storageKey}`
        );

        if (!response.ok) {
            throw new Error('Failed to load history');
        }

        const data = await response.json();
        return data.histories;
    }

    /**
     * 保存历史记录
     */
    async saveHistory(histories: ChatHistory[], storageKey: string): Promise<void> {
        if (!this.userId) {
            throw new Error('User not identified');
        }

        const response = await fetch(
            `${this.baseUrl}/history/${this.userId}/${storageKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ histories }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to save history');
        }
    }

    /**
     * 同步历史记录
     */
    async syncHistory(histories: ChatHistory[], storageKey: string): Promise<SyncResponse> {
        if (!this.userId) {
            throw new Error('User not identified');
        }

        const response = await fetch(
            `${this.baseUrl}/history/${this.userId}/${storageKey}/sync`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ histories }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to sync history');
        }

        return response.json();
    }

    /**
     * 删除历史记录
     */
    async deleteHistory(historyId: number, storageKey: string): Promise<void> {
        if (!this.userId) {
            throw new Error('User not identified');
        }

        const response = await fetch(
            `${this.baseUrl}/history/${this.userId}/${storageKey}/${historyId}`,
            {
                method: 'DELETE',
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete history');
        }
    }

    /**
     * 重命名历史记录
     */
    async renameHistory(historyId: number, title: string, storageKey: string): Promise<void> {
        if (!this.userId) {
            throw new Error('User not identified');
        }

        const response = await fetch(
            `${this.baseUrl}/history/${this.userId}/${storageKey}/${historyId}/rename`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to rename history');
        }
    }

    /**
     * 清除所有历史记录
     */
    async clearAllHistory(storageKey: string): Promise<void> {
        if (!this.userId) {
            throw new Error('User not identified');
        }

        const response = await fetch(
            `${this.baseUrl}/history/${this.userId}/${storageKey}/all`,
            {
                method: 'DELETE',
            }
        );

        if (!response.ok) {
            throw new Error('Failed to clear all history');
        }
    }
}

export const apiHistoryService = new ApiHistoryService();
