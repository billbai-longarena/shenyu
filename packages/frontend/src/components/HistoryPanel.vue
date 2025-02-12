<template>
    <div class="history-panel">
        <div class="sync-status" v-if="syncing || error">
            <el-alert
                v-if="error"
                :title="error"
                type="error"
                :closable="false"
                show-icon
            />
            <el-alert
                v-else-if="syncing"
                :title="t('historyPanel.syncing')"
                type="info"
                :closable="false"
                show-icon
            />
        </div>
        <div class="new-chat-button">
            <el-button type="primary" @click="onStartNewChat" style="width: 100%">
                {{ t('historyPanel.newChat') }}
            </el-button>
        </div>
        <div class="history-list">
            <div v-for="(history, index) in chatHistory"
                :key="index"
                class="history-item"
                :class="{ 'selected': selectedHistoryId === history.id }"
                @mouseenter="hoveredHistory = history.id"
                @mouseleave="hoveredHistory = null"
                @click="onSelectHistory(history)">
                {{ history.title }}
                <!-- 编辑和删除按钮 -->
                <div v-if="hoveredHistory === history.id" class="history-actions">
                    <el-button size="small" @click.stop="editHistory(history)">
                        <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button size="small" type="danger" @click.stop="confirmDelete(history)">
                        <el-icon><Delete /></el-icon>
                    </el-button>
                </div>
            </div>
        </div>
        <!-- 删除所有记录按钮 -->
        <div v-if="chatHistory.length > 0" class="clear-all-button">
            <el-button type="danger" @click="confirmClearAll" style="width: 100%">
                {{ t('historyPanel.deleteAll') }}
            </el-button>
        </div>

        <!-- 编辑历史记录对话框 -->
        <el-dialog
            v-model="editDialogVisible"
            :title="t('historyPanel.editTitle')"
            width="30%">
            <el-input v-model="editingTitle" :placeholder="t('historyPanel.inputTitle')" />
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="editDialogVisible = false">{{ t('historyPanel.cancel') }}</el-button>
                    <el-button type="primary" @click="saveHistoryEdit">{{ t('historyPanel.confirm') }}</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 删除确认对话框 -->
        <el-dialog
            v-model="deleteDialogVisible"
            :title="t('historyPanel.deleteConfirm')"
            width="30%">
            <span>{{ t('historyPanel.deleteMessage') }}</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteDialogVisible = false">{{ t('historyPanel.cancel') }}</el-button>
                    <el-button type="danger" @click="deleteHistory">{{ t('historyPanel.confirm') }}</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 清除所有记录确认对话框 -->
        <el-dialog
            v-model="clearAllDialogVisible"
            :title="t('historyPanel.deleteConfirm')"
            width="30%">
            <span>{{ t('historyPanel.deleteAllMessage') }}</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="clearAllDialogVisible = false">{{ t('historyPanel.cancel') }}</el-button>
                    <el-button type="danger" @click="clearAllConfirmed">{{ t('historyPanel.confirm') }}</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/**
 * 历史记录面板组件
 * 
 * 提供历史记录的展示和管理功能，包括：
 * - 显示历史记录列表
 * - 支持新建对话
 * - 支持编辑历史记录标题
 * - 支持删除历史记录
 * - 支持选择历史记录
 * - 自动保存到本地存储
 * 
 * @example
 * ```vue
 * <HistoryPanel
 *   storage-key="chat-history"
 *   @select="handleSelect"
 *   @new-chat="handleNewChat"
 *   @update="handleUpdate"
 * />
 * ```
 */

import { ref, onMounted } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { useHistory } from '../composables/useHistory'
import { useLanguage } from '../composables/useLanguage'
import type { ChatHistory, Message } from '../types/chat'

/**
 * 组件属性定义
 */

const props = defineProps<{
    /** 本地存储的键名，用于区分不同的历史记录集合 */
    storageKey?: string
}>()

/**
 * 组件事件定义
 */
const emit = defineEmits<{
    /** 选择历史记录时触发 */
    (e: 'select', history: ChatHistory): void
    /** 开启新对话时触发 */
    (e: 'new-chat'): void
    /** 更新历史记录时触发 */
    (e: 'update', history: ChatHistory): void
}>()

// 获取翻译函数
const { t } = useLanguage()

// 添加选中状态的ref
const selectedHistoryId = ref<number | null>(null)

// 添加清除所有记录的状态
const clearAllDialogVisible = ref(false)

const {
    chatHistory,
    hoveredHistory,
    editDialogVisible,
    deleteDialogVisible,
    editingHistory,
    editingTitle,
    syncing,
    lastSync,
    error,
    selectHistory,
    editHistory,
    saveHistoryEdit,
    confirmDelete,
    deleteHistory,
    startNewChat,
    loadHistory,
    addHistory,
    clearAllHistory
} = useHistory(props.storageKey, (event, ...args) => {
    // @ts-ignore
    emit(event, ...args)
})

// 确保loadHistory是异步调用
onMounted(async () => {
    await loadHistory()
})


// 选择历史记录时触发事件
const onSelectHistory = (history: ChatHistory) => {
    selectedHistoryId.value = history.id
    selectHistory(history)
    emit('select', history)
}

// 开启新对话时触发事件
const onStartNewChat = () => {
    // 清理编辑状态
    selectedHistoryId.value = null
    editingHistory.value = null
    // 调用startNewChat清理历史记录状态
    startNewChat()
    // 通知父组件
    emit('new-chat')
}

// 更新或创建新的历史记录
const updateOrCreateHistory = (messages: Message[]) => {
    if (editingHistory.value) {
        // 更新现有对话
        const index = chatHistory.value.findIndex(h => h.id === editingHistory.value?.id)
        if (index !== -1) {
            chatHistory.value[index].messages = [...messages]
            emit('update', chatHistory.value[index])
        }
    } else {
        // 创建新的历史记录
        // 从消息中获取第一条，它应该包含完整的对话内容
        const firstMessage = messages[0]
        let title = t('historyPanel.defaultTitle')
        
        if (firstMessage && typeof firstMessage.content === 'string') {
            // 如果内容是JSON格式，尝试解析获取inputA1
            try {
                const content = JSON.parse(firstMessage.content)
                if (content.userInputs?.inputA1) {
                    title = content.userInputs.inputA1
                }
            } catch (e) {
                // 如果不是JSON格式，直接使用消息内容
                title = firstMessage.content
            }
            
            // 截断标题
            if (title.length > 15) {
                title = title.slice(0, 15) + '...'
            }
        }

        const newHistory: ChatHistory = {
            id: Date.now(),
            title,
            messages: [...messages]
        }
        addHistory(newHistory)
        editingHistory.value = newHistory
        emit('update', newHistory)
    }
}

// 清除所有记录相关的方法
const confirmClearAll = () => {
    clearAllDialogVisible.value = true
}

const clearAllConfirmed = async () => {
    await clearAllHistory()
    clearAllDialogVisible.value = false
    selectedHistoryId.value = null
    editingHistory.value = null
    emit('new-chat')
}

defineExpose({
    updateOrCreateHistory
})
</script>

<style scoped>
.history-panel {
    width: 250px;
    border-right: 1px solid #dcdfe6;
    overflow-y: auto;
    background-color: #f5f7fa;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
}

.sync-status {
    position: sticky;
    top: 0;
    z-index: 11;
    padding: 8px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #dcdfe6;
}

.sync-status .el-alert {
    margin: 0;
    padding: 8px 16px;
}

.new-chat-button {
    padding: 10px;
    background-color: #ffffff;
    border-bottom: 1px solid #dcdfe6;
}

.clear-all-button {
    padding: 10px;
    background-color: #ffffff;
    border-bottom: 1px solid #dcdfe6;
}

.history-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.history-item {
    padding: 10px;
    margin-bottom: 5px;
    cursor: pointer;
    border-radius: 4px;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #ebeef5;
    color: #333333;
    font-weight: 500;
}

.history-item:hover {
    background-color: #ecf5ff;
    border-color: #409eff;
}

.history-item.selected {
    background-color: #409eff1a;
    border-color: #409eff;
    font-weight: bold;
}

.history-actions {
    display: flex;
    gap: 5px;
}
</style>
