const DEFAULT_HISTORY_KEY = 'chat_history'

export interface StorageService {
    saveHistory(history: any[], key?: string): void;
    loadHistory(key?: string): any[];
    clearHistory(key?: string): void;
}

export const localStorageService: StorageService = {
    saveHistory(history: any[], key: string = DEFAULT_HISTORY_KEY): void {
        localStorage.setItem(key, JSON.stringify(history))
    },

    loadHistory(key: string = DEFAULT_HISTORY_KEY): any[] {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : []
    },

    clearHistory(key: string = DEFAULT_HISTORY_KEY): void {
        localStorage.removeItem(key)
    }
}
