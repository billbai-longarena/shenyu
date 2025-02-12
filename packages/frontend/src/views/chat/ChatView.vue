<template>
  <div class="page-container">
    <!-- 左侧历史记录 -->
    <HistoryPanel
      ref="historyPanel"
      :storage-key="$route.meta.storageKey"
      @select="selectHistory"
      @new-chat="startNewChat"
    />

    <!-- 右侧聊天区域 -->
    <div class="chat-panel">
      <!-- 消息列表区域 -->
      <div class="messages-container">
        <div class="messages" ref="messagesContainer">
          <div v-for="(message, index) in currentMessages" 
               :key="index" 
               :class="['message', message.role]">
            <div v-if="message.role === 'user'">{{ message.content }}</div>
            <div v-else class="assistant-message">
              <div class="loading-icon" v-if="isLastMessage(index) && isStreaming">
                <svg viewBox="0 0 1024 1024" class="loading">
                  <path d="M512 64q14.016 0 23.008 8.992T544 96v192q0 14.016-8.992 23.008T512 320t-23.008-8.992T480 288V96q0-14.016 8.992-23.008T512 64zm0 640q14.016 0 23.008 8.992T544 736v192q0 14.016-8.992 23.008T512 960t-23.008-8.992T480 928V736q0-14.016 8.992-23.008T512 704zm448-192q0 14.016-8.992 23.008T928 544H736q-14.016 0-23.008-8.992T704 512t8.992-23.008T736 480h192q14.016 0 23.008 8.992T960 512zm-640 0q0 14.016-8.992 23.008T288 544H96q-14.016 0-23.008-8.992T64 512t8.992-23.008T96 480h192q14.016 0 23.008 8.992T320 512zM195.008 195.008q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zm454.016 454.016q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zM828.992 195.008q8.992 10.016 8.992 23.008t-8.992 22.016l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992zM375.008 649.024q8.992 10.016 8.992 22.016t-8.992 23.008l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992z"/>
                </svg>
              </div>
              <div class="markdown-content" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-area">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            :placeholder="t('chat.inputPlaceholder')"
            @keyup.enter.exact="sendMessage"
          />
          <el-button type="primary" @click="sendMessage">{{ t('chat.sendButton') }}</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, inject, onMounted, onUnmounted, type Ref } from 'vue'
import { useStreamResponse } from '../../composables/useStreamResponse'
import { useLanguage } from '../../composables/useLanguage'
import type { Message, ChatHistory } from '../../types/chat'
import type { ModelType } from '../../api/api-deepseekStream'
import HistoryPanel from '../../components/HistoryPanel.vue'
import '../../assets/styles/layout.css'

// 状态定义
const userInput = ref('')
const currentMessages = ref<Message[]>([])
const messagesContainer = ref<HTMLDivElement | null>(null)
const historyPanel = ref()
const selectedModel = inject<Ref<ModelType>>('selectedModel', ref('kimi'))
const { t } = useLanguage()

// 初始化流式响应
const { isStreaming, handleStreamResponse } = useStreamResponse()

import { marked } from 'marked'

// 配置marked
marked.setOptions({
  breaks: true,    // 支持GitHub风格的换行符
  gfm: true,       // 启用GitHub风格的Markdown
  pedantic: false  // 不要过分严格
})

// 处理markdown渲染
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  return marked.parse(text, { async: false }) as string
}

// 检查是否是最后一条消息
const isLastMessage = (index: number) => {
  return index === currentMessages.value.length - 1
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim()) return

  const userMessage: Message = {
    role: 'user' as const,
    content: userInput.value
  }

  currentMessages.value.push(userMessage)
  const input = userInput.value
  userInput.value = ''

  // 创建一个空的AI消息
  const aiMessage: Message = {
    role: 'assistant' as const,
    content: ''
  }
  currentMessages.value.push(aiMessage)
  scrollToBottom()

  try {
    console.log('[ChatView] 开始处理流式响应')
    const response = await handleStreamResponse(
      input,
      async (chunk: string, processedChunk: string) => {
        // 检查是否是完成或错误标记
        if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
          console.log('[ChatView] 收到新的数据块:', {
            原始数据: chunk,
            处理后数据: processedChunk
          })
          // 累加新的数据块到现有内容
          const lastIndex = currentMessages.value.length - 1
          const currentMessage = currentMessages.value[lastIndex]
          const updatedMessage = {
            ...currentMessage,
            content: currentMessage.content + processedChunk
          }
          console.log('[ChatView] 更新后的消息内容:', updatedMessage.content)
          currentMessages.value.splice(lastIndex, 1, updatedMessage)
          await nextTick()
          scrollToBottom()
        } else {
          console.log('[ChatView] 收到特殊标记:', chunk)
        }
      },
      {
        onError: (error) => {
          console.error('[ChatView] 聊天错误:', error)
        }
      },
      selectedModel.value
    )
    console.log('[ChatView] 流式响应处理完成')

    // 更新历史记录
    historyPanel.value?.updateOrCreateHistory(currentMessages.value)
  } catch (error) {
    console.error('Error:', error)
  }
}

// 选择历史记录
const selectHistory = (history: ChatHistory) => {
  currentMessages.value = [...history.messages]
  scrollToBottom()
}

// 滚动到底部
const scrollToBottom = () => {
  const container = messagesContainer.value
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

// 开启新对话
const startNewChat = () => {
  currentMessages.value = []
  userInput.value = ''
}

// 监听语言切换事件
const handleLanguageChange = (event: CustomEvent) => {
  if (event.detail?.shouldStartNewChat) {
    startNewChat()
  }
}

onMounted(() => {
  window.addEventListener('language-changed', handleLanguageChange as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('language-changed', handleLanguageChange as EventListener)
})
</script>

<style scoped>
.page-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background-color: #ffffff;
}

.messages-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 20px 15%;
}

.message {
  margin-bottom: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 80%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message.user {
  background-color: #409eff;
  color: #ffffff;
  margin-left: auto;
}

.message.assistant {
  background-color: #f4f4f5;
  color: #333333;
  margin-right: auto;
  border: 1px solid #e4e7ed;
}

.assistant-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.loading-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.loading {
  animation: rotate 1s linear infinite;
  fill: #409eff;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.markdown-content {
  line-height: 1.6;
  flex: 1;
  font-size: 14px;
  text-align: left;
  white-space: normal;      /* 允许正常的文本换行 */
  word-break: break-word;   /* 允许在任意字符间换行 */
}

.markdown-content :deep(*) {
  white-space: pre-wrap;      /* 确保所有子元素都保留空格和换行 */
}

/* Markdown样式 */
.markdown-content :deep(pre) {
  background-color: #f8f9fa;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
  display: block;           /* 确保代码块独占一行 */
}

.markdown-content :deep(code) {
  background-color: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
  white-space: pre-wrap;    /* 保留段落中的换行和空格 */
  min-height: 1.2em;        /* 确保空段落也有高度 */
  display: block;           /* 确保段落独占一行 */
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 1em;
  font-weight: 600;
}

.markdown-content :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid #dcdfe6;
  color: #666;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 0.6em 1em;
}

.markdown-content :deep(th) {
  background-color: #f8f9fa;
}

.input-container {
  border-top: 1px solid #dcdfe6;
  background-color: #f5f7fa;
  padding: 20px 15%;
}

.input-area {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.el-input {
  flex: 1;
}

.el-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  min-height: 80px !important;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
}

.el-button {
  height: 80px;
  width: 100px;
  flex-shrink: 0;
  font-size: 16px;
}
</style>
