<template>
  <div class="page-container">
    <!-- 左侧历史记录 -->
    <HistoryPanel
      ref="historyPanel"
      :storage-key="$route.meta.storageKey"
      @select="selectHistory"
      @new-chat="startNewChat"
    />

    <!-- 右侧内容区域 -->
    <div class="content-panel">
      <!-- 顶部标签页 -->
      <el-tabs v-model="activeTab" class="full-height">
        <el-tab-pane :label="t('sn43.userInterface')" name="user">
          <UserInterface
            :user-inputs="userInputs"
            :admin-inputs="adminInputs"
            :prompt-blocks="promptBlocks"
            :is-editing="isEditing"
            :output-result="outputResult"
            :input-counter="inputCounter"
            :is-config-modified="isConfigModified"
            :selected-json-file="selectedJsonFile"
            @update:user-inputs="updateUserInputs"
            @update:admin-inputs="updateAdminInputs"
            @update:prompt-blocks="updatePromptBlocks"
            @update:input-counter="updateInputCounter"
            @update:selected-json-file="updateSelectedJsonFile"
            @execution-complete="handleExecutionComplete"
          />
        </el-tab-pane>
        
        <el-tab-pane :label="t('sn43.adminConfig')" name="admin">
          <ConfigPanel
            :admin-inputs="adminInputs"
            :user-inputs="userInputs"
            :prompt-blocks="promptBlocks"
            :input-counter="inputCounter"
            :preview-text="previewText"
            :is-preview-loading="isPreviewLoading"
            @update:admin-inputs="updateAdminInputs"
            @update:user-inputs="updateUserInputs"
            @update:prompt-blocks="updatePromptBlocks"
            @update:input-counter="updateInputCounter"
            @update:preview-text="updatePreviewText"
            @update:is-preview-loading="updateIsPreviewLoading"
            @config-modified="handleConfigModified"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import type { ChatHistory } from '../../types/chat'
import HistoryPanel from '../../components/HistoryPanel.vue'
import UserInterface from '../../components/sn43/UserInterface.vue'
import ConfigPanel from '../../components/sn43/ConfigPanel.vue'
import { ElMessage } from 'element-plus'
import '../../assets/styles/layout.css'
import { useJsonFiles } from '../../composables/useJsonFiles'
import { useLanguage } from '../../composables/useLanguage'

const { getDefaultFile, fetchJsonFiles } = useJsonFiles()
const { currentLanguage, t } = useLanguage()

// 状态定义
const activeTab = ref('user')
const historyPanel = ref()
const isEditing = ref(false)
const inputCounter = ref(0)
const adminInputs = reactive<{[key: string]: string}>({})
const userInputs = reactive<{[key: string]: string}>({})
const promptBlocks = reactive<{text: string}[]>([])
const outputResult = ref('')
const previewText = ref('')
const isPreviewLoading = ref(false)
const isConfigModified = ref(false)
const selectedJsonFile = ref('')

// 组件加载时初始化
onMounted(async () => {
  // 初始化一个空的提示词块
  if (promptBlocks.length === 0) {
    promptBlocks.push({ text: '' })
  }
  
  try {
    // 获取文件列表
    await fetchJsonFiles()
    // 设置默认文件
    if (!selectedJsonFile.value) {
      selectedJsonFile.value = getDefaultFile.value
    }
  } catch (error) {
    console.error('Failed to initialize file list:', error)
  }
})

// 监听语言变化事件
const handleLanguageChange = async (event: Event) => {
  const customEvent = event as CustomEvent<{lang: string; shouldStartNewChat: boolean}>
  try {
    if (customEvent.detail?.shouldStartNewChat) {
      await startNewChat()
    } else {
      // 重新获取文件列表
      await fetchJsonFiles()
      // 重置选中的文件为当前语言的默认文件
      selectedJsonFile.value = getDefaultFile.value
    }
  } catch (error) {
    console.error('Failed to handle language change:', error)
  }
}

onMounted(() => {
  window.addEventListener('language-changed', handleLanguageChange)
})

onUnmounted(() => {
  window.removeEventListener('language-changed', handleLanguageChange)
})

// 更新函数
const updateUserInputs = (value: { [key: string]: string }) => {
  // 创建新的对象引用以触发响应式更新
  Object.keys(userInputs).forEach(key => delete userInputs[key])
  Object.assign(userInputs, value)
}

const updateAdminInputs = (value: { [key: string]: string }) => {
  // 创建新的对象引用以触发响应式更新
  Object.keys(adminInputs).forEach(key => delete adminInputs[key])
  Object.assign(adminInputs, value)
}

const updatePromptBlocks = (value: { text: string }[]) => {
  promptBlocks.splice(0, promptBlocks.length, ...value)
}

const updateInputCounter = (value: number) => {
  inputCounter.value = value
}

const updatePreviewText = (value: string) => {
  previewText.value = value
}

const updateIsPreviewLoading = (value: boolean) => {
  isPreviewLoading.value = value
}

const updateSelectedJsonFile = (value: string) => {
  selectedJsonFile.value = value
}

// 处理配置修改
const handleConfigModified = () => {
  isConfigModified.value = true
}

// 执行完成处理
const handleExecutionComplete = (messages: any[]) => {
  // 更新输出结果
  const assistantMessages = messages.filter(msg => msg.role === 'assistant')
  if (assistantMessages.length > 0) {
    // 合并所有 assistant 消息的内容，使用分隔符分隔
    outputResult.value = assistantMessages
      .map(msg => msg.content)
      .join('<hr class="block-divider">')
  }
  
  // 修改第一条消息，添加selectedJsonFile
  if (messages.length > 0 && messages[0].role === 'user') {
    try {
      const content = JSON.parse(messages[0].content)
      content.selectedJsonFile = selectedJsonFile.value
      messages[0].content = JSON.stringify(content, null, 2)
    } catch (error) {
      console.error('Failed to update message content:', error)
    }
  }
  
  // 更新历史记录并设置编辑状态
  historyPanel.value?.updateOrCreateHistory(messages)
  isEditing.value = true
}

// 选择历史记录
const selectHistory = async (history: ChatHistory) => {
  try {
    // 设置编辑状态
    isEditing.value = true
    
    // 恢复用户输入状态
    const data = JSON.parse(history.messages[0].content)
    
    // 清空现有配置
    Object.keys(userInputs).forEach(key => delete userInputs[key])
    Object.keys(adminInputs).forEach(key => delete adminInputs[key])
    
    // 导入新配置
    Object.assign(userInputs, data.userInputs)
    if (data.adminInputs) {
      Object.assign(adminInputs, data.adminInputs)
    }
    
    // 更新提示词块
    promptBlocks.splice(0, promptBlocks.length, ...data.promptBlocks.map((text: string) => ({ text })))
    
    // 更新inputCounter
    const maxNumber = Math.max(
      ...Object.keys(data.userInputs)
        .map(key => parseInt(key.replace('inputA', '')))
        .filter(num => !isNaN(num)),
      ...Object.keys(data.adminInputs || {})
        .map(key => parseInt(key.replace('inputB', '')))
        .filter(num => !isNaN(num)),
      0
    )
    inputCounter.value = maxNumber

    // 恢复选中的JSON文件
    if (data.selectedJsonFile) {
      selectedJsonFile.value = data.selectedJsonFile
    }

    // 恢复输出结果
    const assistantMessages = history.messages.filter(msg => msg.role === 'assistant')
    if (assistantMessages.length > 0) {
      // 合并所有 assistant 消息的内容，使用分隔符分隔
      outputResult.value = assistantMessages
        .map(msg => msg.content)
        .join('<hr class="block-divider">')
    }

    // 通知HistoryPanel当前正在编辑这条历史记录
    historyPanel.value?.updateOrCreateHistory(history.messages)
  } catch (error) {
    console.error('Failed to parse history:', error)
    ElMessage.error(t('sn43.restoreHistoryError'))
  }
}

// 开启新对话
const startNewChat = async () => {
  console.log('Starting new chat')
  
  // 重置编辑状态
  isEditing.value = false
  
  // 清空所有状态
  Object.keys(userInputs).forEach(key => delete userInputs[key])
  Object.keys(adminInputs).forEach(key => delete adminInputs[key])
  promptBlocks.splice(0, promptBlocks.length, { text: '' })
  outputResult.value = ''
  previewText.value = ''
  inputCounter.value = 0
  
  try {
    // 重新获取文件列表并设置默认文件
    await fetchJsonFiles()
    selectedJsonFile.value = getDefaultFile.value
  } catch (error) {
    console.error('Failed to set default file:', error)
    selectedJsonFile.value = ''
  }
  
  // 重置配置修改状态
  isConfigModified.value = false
  
  ElMessage.success(t('sn43.newChatSuccess'))
}
</script>

<style scoped>
.page-container {
  display: flex;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  height: calc(100vh - 60px); /* 减去顶部导航栏的高度 */
}

.full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  box-sizing: border-box;
}

:deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
</style>
