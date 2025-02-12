<template>
  <div class="admin-interface-container">
    <!-- 左侧配置区域 -->
    <div class="config-section" :style="{ width: leftWidth + '%' }">
      <div class="config-section-content">
        <div class="config-inputs-container">
          <h2 class="admin-title">{{ t('configPanel.userInputConfig') }}</h2>
          
          <!-- 配置操作按钮 -->
          <div class="config-actions">
            <el-button 
              type="danger"
              @click="exportConfig"
            >
              {{ t('configPanel.saveExport') }}
            </el-button>
            <el-button 
              type="primary"
              @click="fileInput?.click()"
            >
              {{ t('configPanel.importJson') }}
            </el-button>
          </div>
          
          <!-- 隐藏的文件输入框 -->
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            accept=".json"
            @change="handleFileUpload"
          />

          <!-- 动态生成的配置输入框 -->
          <div v-for="(value, key) in adminInputs" :key="key" class="input-group">
            <div class="input-with-label">
              <el-button 
                type="primary" 
                link
                class="insert-button"
                @click="insertPlaceholder(String(key))"
                :disabled="lastFocusedIndex === null"
              >
                {{ t('configPanel.insert') }}
              </el-button>
              <el-input 
                v-model="adminInputs[key]"
                :placeholder="t('configPanel.inputPlaceholder') + key"
                @input="(value: string) => handleAdminInput(String(key), value)"
              />
              <el-button
                type="danger"
                link
                @click="deleteAdminInput(String(key))"
              >
                {{ t('configPanel.delete') }}
              </el-button>
            </div>
          </div>
           <!-- 增加用户输入按钮 -->
           <el-button 
            type="primary" 
            class="add-input-button"
            @click="addUserInput"
          >
            {{ t('configPanel.addUserInput') }}
          </el-button>

          <!-- 预览区域 -->
          <div class="preview-section">
            <h3 class="preview-title">{{ t('configPanel.previewTitle') }}</h3>
            <div class="preview-content" ref="previewContent">
              <div class="messages">
                <div class="message">
                  <div class="assistant-message">
                    <div class="loading-icon" v-if="isPreviewLoading">
                      <svg viewBox="0 0 1024 1024" class="loading">
                        <path d="M512 64q14.016 0 23.008 8.992T544 96v192q0 14.016-8.992 23.008T512 320t-23.008-8.992T480 288V96q0-14.016 8.992-23.008T512 64zm0 640q14.016 0 23.008 8.992T544 736v192q0 14.016-8.992 23.008T512 960t-23.008-8.992T480 928V736q0-14.016 8.992-23.008T512 704zm448-192q0 14.016-8.992 23.008T928 544H736q-14.016 0-23.008-8.992T704 512t8.992-23.008T736 480h192q14.016 0 23.008 8.992T960 512zm-640 0q0 14.016-8.992 23.008T288 544H96q-14.016 0-23.008-8.992T64 512t8.992-23.008T96 480h192q14.016 0 23.008 8.992T320 512zM195.008 195.008q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zm454.016 454.016q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zM828.992 195.008q8.992 10.016 8.992 23.008t-8.992 22.016l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992zM375.008 649.024q8.992 10.016 8.992 22.016t-8.992 23.008l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992z"/>
                      </svg>
                    </div>
                    <div class="markdown-content" v-html="renderedPreviewText"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 拖动分隔条 -->
    <div 
      class="resize-handle"
      @mousedown="startResize"
      @dblclick="resetWidths"
    ></div>

    <!-- 右侧提示词区域 -->
    <div class="prompt-section" ref="promptSection" :style="{ width: (100 - leftWidth) + '%' }">
      <div class="prompt-config">
        <h2 class="admin-title">{{ t('configPanel.promptConfig') }}</h2>
        
        <!-- 提示词输入区域 -->
        <div v-for="(prompt, index) in promptBlocks" :key="index" class="prompt-container">
          <div class="prompt-input-group">
            <el-button 
              type="primary" 
              link
              class="insert-button"
              @click="insertPromptBlock(index)"
              :disabled="lastFocusedIndex === null || !canInsertPromptBlock(index, lastFocusedIndex)"
            >
              {{ t('configPanel.insert') }}
            </el-button>
            <div class="prompt-input-wrapper">
              <el-input
                v-model="prompt.text"
                type="textarea"
                :rows="4"
                :placeholder="t('configPanel.inputPromptPlaceholder')"
                class="prompt-input"
                @focus="handlePromptFocus(index)"
                @input="emit('config-modified')"
                :ref="(el: any) => setPromptRef(el, index)"
                @update:modelValue="(value) => updatePromptText(index, value)"
              />
              <div class="prompt-actions">
                <el-button 
                  type="primary"
                  class="preview-button"
                  @click="previewPrompt(index)"
                >
                  {{ t('configPanel.previewPrompt') }}
                </el-button>
                <el-button
                  type="danger"
                  link
                  @click="deletePromptBlock(index)"
                >
                  {{ t('configPanel.delete') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
         <!-- 增加提示词块按钮 -->
         <el-button 
          type="primary" 
          class="add-prompt-button"
          @click="addPromptBlock"
        >
          {{ t('configPanel.addPromptBlock') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfig } from '../../composables/useConfig'
import { usePrompt } from '../../composables/usePrompt'
import { useLanguage } from '../../composables/useLanguage'

interface Props {
  adminInputs: { [key: string]: string }
  userInputs: { [key: string]: string }
  promptBlocks: { text: string }[]
  inputCounter: number
  previewText: string
  isPreviewLoading: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:adminInputs', value: { [key: string]: string }): void
  (e: 'update:userInputs', value: { [key: string]: string }): void
  (e: 'update:promptBlocks', value: { text: string }[]): void
  (e: 'update:inputCounter', value: number): void
  (e: 'update:previewText', value: string): void
  (e: 'update:isPreviewLoading', value: boolean): void
  (e: 'config-modified'): void
}

const emit = defineEmits<Emits>()

// 获取翻译函数
const { t } = useLanguage()

const fileInput = ref<HTMLInputElement | null>(null)
// 配置marked选项
marked.setOptions({
  breaks: true,    // 支持GitHub风格的换行符
  gfm: true,       // 启用GitHub风格的Markdown
  pedantic: false  // 不要过分严格
})

const previewContent = ref<HTMLDivElement | null>(null)
const renderedPreviewText = computed(() => {
  return props.previewText ? marked(props.previewText).toString() : ''
})

// 滚动到底部
const scrollToBottom = () => {
  if (previewContent.value) {
    const messages = previewContent.value.querySelector('.messages')
    if (messages) {
      messages.scrollTop = messages.scrollHeight
    }
  }
}

// 监听预览文本变化
watch(() => props.previewText, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

const leftWidth = ref(40) // 左侧区域的初始宽度百分比

// 拖动相关的状态
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

// 开始拖动
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = leftWidth.value
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  // 添加禁止选择文本的类
  document.body.classList.add('resizing')
}

// 处理拖动
const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const container = document.querySelector('.admin-interface-container')
  if (!container) return
  
  const dx = e.clientX - startX.value
  const containerWidth = container.getBoundingClientRect().width
  const newWidthPercent = startWidth.value + (dx / containerWidth * 100)
  
  // 限制拖动范围在20%到80%之间
  leftWidth.value = Math.min(Math.max(newWidthPercent, 20), 80)
}

// 停止拖动
const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  // 移除禁止选择文本的类
  document.body.classList.remove('resizing')
}

// 双击重置宽度
const resetWidths = () => {
  leftWidth.value = 40
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.classList.remove('resizing')
})

// 监听adminInputs的变化，检查是否有默认值需要设置
watch(() => props.adminInputs, (newAdminInputs) => {
  Object.entries(newAdminInputs).forEach(([key, value]) => {
    const match = value.match(/<def>(.*?)<\/def>/)
    if (match) {
      const userKey = `inputA${key.replace('inputB', '')}`
      const defaultValue = match[1]
      const newUserInputs = { ...props.userInputs }
      newUserInputs[userKey] = defaultValue
      emit('update:userInputs', newUserInputs)
    }
  })
}, { immediate: true, deep: true })

const promptSection = ref<HTMLElement | null>(null)
const { exportConfig, importConfig } = useConfig(props, emit)
const { 
  lastFocusedIndex,
  promptRefs,
  handlePromptFocus,
  addPromptBlock,
  setPromptRef,
  insertPlaceholder,
  previewPrompt,
  getPromptBlockPlaceholder,
  canInsertPromptBlock,
  deletePromptBlock
} = usePrompt(props, emit)

// 处理管理员输入
const handleAdminInput = (key: string, value: string) => {
  // 检查是否包含<def>标签
  const match = value.match(/<def>(.*?)<\/def>/)
  if (match) {
    // 获取对应的userInput的key (从inputB1转换为inputA1)
    const userKey = `inputA${key.replace('inputB', '')}`
    // 获取默认值
    const defaultValue = match[1]
    
    // 更新对应的userInput
    const newUserInputs = { ...props.userInputs }
    newUserInputs[userKey] = defaultValue
    emit('update:userInputs', newUserInputs)
  }
  
  emit('config-modified')
}

// 添加用户输入
const addUserInput = () => {
  const newCounter = props.inputCounter + 1
  emit('update:inputCounter', newCounter)
  
  const adminKey = `inputB${newCounter}`
  const newAdminInputs = { ...props.adminInputs }
  newAdminInputs[adminKey] = ''
  emit('update:adminInputs', newAdminInputs)
  
  // 同时创建用户界面的输入框
  const userKey = `inputA${newCounter}`
  const newUserInputs = { ...props.userInputs }
  newUserInputs[userKey] = ''
  emit('update:userInputs', newUserInputs)

  // 触发配置修改事件
  emit('config-modified')
}

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target?.result as string)
      importConfig(config)
      // 触发配置修改事件
      emit('config-modified')
    } catch (error) {
      console.error('导入配置失败:', error)
      ElMessage.error(t('configPanel.importError'))
    }
    
    // 清空文件输入框
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
  reader.readAsText(file)
}

// 保存滚动位置
const saveScrollPosition = () => {
  return promptSection.value?.scrollTop || 0
}

// 恢复滚动位置
const restoreScrollPosition = (position: number) => {
  if (promptSection.value) {
    promptSection.value.scrollTop = position
  }
}

// 更新提示词文本
const updatePromptText = (index: number, value: string) => {
  const newBlocks = [...props.promptBlocks]
  newBlocks[index] = { text: value }
  emit('update:promptBlocks', newBlocks)
}

// 插入提示词块占位符
const insertPromptBlock = (index: number) => {
  if (lastFocusedIndex.value === null) {
    ElMessage.warning(t('configPanel.insertWarning'))
    return
  }

  if (!canInsertPromptBlock(index, lastFocusedIndex.value)) {
    ElMessage.warning(t('configPanel.insertBlockWarning'))
    return
  }

  const scrollPosition = saveScrollPosition()
  insertPlaceholder(getPromptBlockPlaceholder(index))
  // 触发配置修改事件
  emit('config-modified')
  nextTick(() => {
    restoreScrollPosition(scrollPosition)
  })
}

// 删除管理员输入框
const deleteAdminInput = async (key: string) => {
  try {
    await ElMessageBox.confirm(
      t('configPanel.deleteInputConfirm'),
      t('configPanel.deleteConfirm'),
      {
        confirmButtonText: t('configPanel.confirm'),
        cancelButtonText: t('configPanel.cancel'),
        type: 'warning'
      }
    )

    // 删除管理员输入框
    const newAdminInputs = Object.fromEntries(
      Object.entries(props.adminInputs).filter(([k]) => k !== key)
    )
    emit('update:adminInputs', newAdminInputs)

    // 同时删除对应的用户输入框
    const userKey = `inputA${key.replace('inputB', '')}`
    const newUserInputs = Object.fromEntries(
      Object.entries(props.userInputs).filter(([k]) => k !== userKey)
    )
    emit('update:userInputs', newUserInputs)

    // 触发配置修改事件
    emit('config-modified')

    ElMessage.success(t('configPanel.deleteSuccess'))
  } catch (error) {
    // 用户取消删除操作，不做任何处理
    if (error !== 'cancel') {
      console.error('删除输入框时发生错误:', error)
      ElMessage.error(t('configPanel.deleteError') + (error as Error).message)
    }
  }
}
</script>

<style scoped>
.admin-interface-container {
  display: flex;
  height: 100%;
}

.config-section {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.config-section-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.prompt-section {
  min-width: 200px;
  padding: 16px;
  box-sizing: border-box;
  overflow-y: auto;
}

.prompt-config {
  height: 100%;
}

.preview-section {
  margin-top: 20px;
  border-top: 1px solid #dcdfe6;
  padding-top: 16px;
  height: 300px;
}

.preview-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.preview-content {
  height: calc(100% - 40px);
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
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
  padding: 12px;
}

.message {
  margin-bottom: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f4f4f5;
  color: #333333;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.markdown-content {
  flex: 1;
  line-height: 1.6;
  font-size: 14px;
  text-align: left;
  white-space: normal;
  word-break: break-word;
}

.markdown-content :deep(*) {
  white-space: pre-wrap;
}

.markdown-content :deep(pre) {
  background-color: #f8f9fa;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content :deep(code) {
  background-color: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(p) {
  margin: 1em 0;
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

.config-inputs-container {
  flex: 1;
}

.config-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.insert-button {
  min-width: 60px;
}

.admin-title {
  color: #1a1a1a;
  font-weight: 600;
  margin: 0;
  line-height: 32px;
}

.input-with-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-group {
  margin-bottom: 15px;
}

.add-input-button,
.add-prompt-button {
  margin-bottom: 20px;
}

.prompt-container {
  margin-top: 20px;
}

.prompt-input-group {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.prompt-input-wrapper {
  flex: 1;
  display: flex;
  gap: 10px;
}

.prompt-input {
  flex: 1;
}

.prompt-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.insert-button {
  min-width: 60px;
  margin-top: 8px;
}

/* 拖动分隔条样式 */
.resize-handle {
  width: 6px;
  background-color: #dcdfe6;
  cursor: col-resize;
  transition: background-color 0.2s;
  position: relative;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: #409eff;
}

.resize-handle::after {
  content: "⋮";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #909399;
  font-size: 16px;
  line-height: 1;
}

/* 拖动时禁止选择文本 */
:global(.resizing) {
  user-select: none;
  cursor: col-resize;
}
</style>
