import { ref, watch } from 'vue'
import type { ChatHistory } from '../types/chat'
import { enhancedStorageService } from '../services/enhanced-storage'

/**
 * 历史记录管理的组合式函数
 * @param storageKey - 本地存储的键名，用于区分不同的历史记录集合
 * @returns {
 *   chatHistory - 历史记录列表
 *   hoveredHistory - 当前悬停的历史记录ID
 *   editDialogVisible - 编辑对话框显示状态
 *   deleteDialogVisible - 删除对话框显示状态
 *   editingHistory - 当前编辑的历史记录
 *   editingTitle - 编辑中的标题
 *   selectHistory - 选择历史记录
 *   editHistory - 编辑历史记录
 *   saveHistoryEdit - 保存编辑
 *   confirmDelete - 确认删除
 *   deleteHistory - 删除历史记录
 *   startNewChat - 开始新对话
 *   addHistory - 添加历史记录
 *   updateHistory - 更新历史记录
 *   loadHistory - 加载历史记录
 * }
 */
export function useHistory(
    storageKey: string = 'default-history',
    emit?: (event: 'new-chat' | 'update' | 'select', ...args: any[]) => void
) {
    const chatHistory = ref<ChatHistory[]>([])
    const hoveredHistory = ref<number | null>(null)
    const editDialogVisible = ref(false)
    const deleteDialogVisible = ref(false)
    const editingHistory = ref<ChatHistory | null>(null)
    const editingTitle = ref('')

    // 同步状态
    const { syncing, lastSync, error } = enhancedStorageService.getStatus();

    // 选择历史记录
    const selectHistory = (history: ChatHistory) => {
        editingHistory.value = history
        return history
    }

    // 编辑历史记录
    const editHistory = (history: ChatHistory) => {
        editingHistory.value = history
        editingTitle.value = history.title
        editDialogVisible.value = true
    }

    // 确认删除
    const confirmDelete = (history: ChatHistory) => {
        editingHistory.value = history
        deleteDialogVisible.value = true
    }

    // 开启新对话
    const startNewChat = () => {
        editingHistory.value = null
    }

    // 添加新历史记录
    const addHistory = (history: ChatHistory) => {
        chatHistory.value.unshift(history)
    }

    // 更新历史记录
    const updateHistory = (history: ChatHistory) => {
        const index = chatHistory.value.findIndex(h => h.id === history.id)
        if (index !== -1) {
            chatHistory.value[index] = history
        }
    }

    // 监听历史记录变化并保存
    watch(chatHistory, async (newHistory) => {
        await enhancedStorageService.saveHistory(newHistory, storageKey);
    }, { deep: true });

    // 加载历史记录
    const loadHistory = async () => {
        // 确保存储服务已初始化
        await enhancedStorageService.initialize();
        const savedHistory = await enhancedStorageService.loadHistory(storageKey);
        if (savedHistory.length > 0) {
            chatHistory.value = savedHistory;
        }
    };

    // 删除历史记录
    const deleteHistory = async () => {
        if (!editingHistory.value) return;

        try {
            const historyId = editingHistory.value.id;
            await enhancedStorageService.deleteHistory(historyId, storageKey);

            // 从本地状态中删除
            const index = chatHistory.value.findIndex(h => h.id === historyId);
            if (index !== -1) {
                chatHistory.value.splice(index, 1);
            }

            // 清理状态并触发新对话
            editingHistory.value = null;
            if (emit) {
                emit('new-chat');
            }
        } catch (error) {
            console.error('Failed to delete history:', error);
        }

        deleteDialogVisible.value = false;
    };

    // 重命名历史记录
    const saveHistoryEdit = async () => {
        if (editingHistory.value) {
            try {
                await enhancedStorageService.renameHistory(
                    editingHistory.value.id,
                    editingTitle.value,
                    storageKey
                );

                // 更新本地状态
                const index = chatHistory.value.findIndex(h => h.id === editingHistory.value?.id);
                if (index !== -1) {
                    chatHistory.value[index].title = editingTitle.value || '';
                }
            } catch (error) {
                console.error('Failed to rename history:', error);
            }
        }
        editDialogVisible.value = false;
    };

    // 清除所有历史记录
    const clearAllHistory = async () => {
        try {
            await enhancedStorageService.clearAllHistory(storageKey);
            chatHistory.value = [];
            editingHistory.value = null;
            if (emit) {
                emit('new-chat');
            }
        } catch (error) {
            console.error('Failed to clear all history:', error);
        }
    };

    return {
        // 状态
        chatHistory,
        hoveredHistory,
        editDialogVisible,
        deleteDialogVisible,
        editingHistory,
        editingTitle,
        syncing,
        lastSync,
        error,

        // 方法
        selectHistory,
        editHistory,
        saveHistoryEdit,
        confirmDelete,
        deleteHistory,
        startNewChat,
        addHistory,
        updateHistory,
        loadHistory,
        clearAllHistory
    }
}
