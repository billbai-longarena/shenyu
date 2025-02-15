<template>
  <div class="admin-interface-container">
    <!-- Agent生成器区域 -->
    <div class="agent-section" :style="{ width: agentWidth + '%' }">
      <div class="agent-section-content">
        <h2 class="admin-title">{{ t('configPanel.agentTitle') }}</h2>
        <!-- AI智能体生成区域 -->
        <div class="agent-generator">
          <el-input
            type="textarea"
            v-model="textareaGenerateAgent"
            :rows="3"
            :placeholder="t('configPanel.agentInputPlaceholder')"
            class="agent-input"
          />
          <el-button 
            type="primary"
            class="generate-button"
            @click="generateAIAgent"
            :disabled="isGenerating"
            :loading="isGenerating"
          >
            {{ t('configPanel.generateAgentButton') }}
          </el-button>
        </div>

        <!-- 路径输入和生成控件区域 -->
        <div class="path-input-section">
          <el-input
            type="textarea"
            v-model="pathInput"
            :rows="3"
            :placeholder="t('configPanel.pathInputPlaceholder')"
            class="path-input"
          />
          <el-button 
            type="primary"
            class="generate-button"
            @click="generateFromText"
            :disabled="!pathInput.trim()"
          >
            {{ t('configPanel.generateControls') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 第一个拖动分隔条 -->
    <div 
      class="resize-handle"
      @mousedown="startResizeAgent"
      @dblclick="resetWidths"
    ></div>

    <!-- 用户输入配置区域 -->
    <div class="config-section" :style="{ width: configWidth + '%' }">
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

    <!-- 第二个拖动分隔条 -->
    <div 
      class="resize-handle"
      @mousedown="startResizeConfig"
      @dblclick="resetWidths"
    ></div>

    <!-- 提示词配置区域 -->
    <div class="prompt-section" ref="promptSection" :style="{ width: promptWidth + '%' }">
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
                :model-value="prompt.text"
                type="textarea"
                :rows="4"
                :placeholder="t('configPanel.inputPromptPlaceholder')"
                :class="['prompt-input', { 'invalid-prompt': prompt.text && !hasPlaceholder(prompt.text) }]"
                @focus="handlePromptFocus(index)"
                @input="(value) => {
                  updatePromptText(index, value);
                  nextTick(() => {
                    emit('config-modified');
                  });
                }"
                :ref="(el: any) => setPromptRef(el, index)"
              />
              <div class="prompt-actions">
                <el-button 
                  type="primary"
                  link
                  class="preview-button"
                  @click="previewPrompt(index)"
                  :disabled="!!(prompt.text && !hasPlaceholder(prompt.text))"
                >
                  {{ prompt.text && !hasPlaceholder(prompt.text) ? t('configPanel.invalidPromptBlockPreview') : t('configPanel.preview') }}
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
import { ref, onMounted, onUnmounted, computed, watch, nextTick, inject } from 'vue'
import { marked } from 'marked'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfig } from '../../composables/useConfig'
import { usePrompt } from '../../composables/usePrompt'
import { useLanguage } from '../../composables/useLanguage'
import { useStreamResponse } from '../../composables/useStreamResponse'
import { setTemperature } from '../../api/api-deepseekStream'

// AI智能体生成相关
const textareaGenerateAgent = ref('')
const isGenerating = ref(false)
const { handleStreamResponse } = useStreamResponse()
const selectedTemperature = inject('selectedTemperature') as any

// 生成AI智能体
const generateAIAgent = async () => {
  if (!textareaGenerateAgent.value.trim()) {
    ElMessage.warning(t('configPanel.agentInputPlaceholder'))
    return
  }

  isGenerating.value = true
  try {
    // 设置为保守模式
    setTemperature(0.1)
    selectedTemperature.value = 0.1

    // 获取所有prompt模板
    const prompts: string[] = []
    let i = 1
    while (true) {
      const key = `configPanel.agentPromptTemplate${i}`
      const template = t(key)
      // 如果template是undefined或者等于key本身，说明没有这个模板了
      if (!template || template === key) {
        break
      }
      prompts.push(template.replace('${input}', textareaGenerateAgent.value))
      i++
    }

    // 清空所有现有配置
    emit('update:adminInputs', {})
    emit('update:promptBlocks', [])
    emit('update:inputCounter', 0)
    
    // 清空现有内容
    pathInput.value = ''
    
    // 存储每个prompt的结果
    const promptResults: string[] = []
    
    // 顺序处理每个prompt
    for (let i = 0; i < prompts.length; i++) {
      let currentPrompt = prompts[i]
      
      // 替换之前结果的占位符
      for (let j = 0; j < promptResults.length; j++) {
        currentPrompt = currentPrompt.replace(
          `\${promptResults${j + 1}}`,
          promptResults[j]
        )
      }
      
      // 是否是最后一个prompt
      const isLastPrompt = i === prompts.length - 1
      
      if (isLastPrompt) {
        // 最后一个prompt使用流式响应
        await handleStreamResponse(
          currentPrompt,
          async (chunk: string, processedChunk: string) => {
            if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
              pathInput.value += processedChunk
            }
          }
        )
      } else {
        // 非最后一个prompt等待完整响应
        const response = await handleStreamResponse(currentPrompt)
        promptResults.push(response.content)
      }
    }

    // 自动点击生成按钮
    await generateFromText()
  } catch (error) {
    console.error('生成AI智能体失败:', error)
    ElMessage.error(t('configPanel.generateAgentError'))
  } finally {
    isGenerating.value = false
  }
}

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

// 路径输入
const pathInput = ref('')

// 清理JSON字符串中的控制字符
const cleanJsonString = (str: string) => {
  return str
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
    .replace(/\n\s*\n/g, '\n') // 移除多余的空行
    .trim();
}

// 从文本生成控件
const generateFromText = async () => {
  const input = pathInput.value
  try {
    // 首先尝试提取JSON内容
    const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g
    const matches = input.match(jsonRegex)
    
    if (!matches || matches.length === 0) {
      ElMessage.warning(t('configPanel.noValidJsonFound'))
      return
    }

    // 清理并解析JSON
    const cleanedJson = cleanJsonString(matches[0])
    const config = JSON.parse(cleanedJson)
    
    // 验证json结构
    if (!config.adminInputs || !config.promptBlocks) {
      ElMessage.warning(t('configPanel.invalidJsonStructure'))
      return
    }
    
    // 导入配置
    await importConfig(config)
    // 触发配置修改事件
    emit('config-modified')
    
    ElMessage.success(t('configPanel.controlsGenerated'))
  } catch (error) {
    console.error('生成控件失败:', error)
    ElMessage.error(t('configPanel.generateError'))
  }
}

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

// 区域宽度
const agentWidth = ref(23) // Agent生成器区域的初始宽度百分比
const configWidth = ref(33) // 用户输入配置区域的初始宽度百分比
const promptWidth = computed(() => 100 - agentWidth.value - configWidth.value) // 提示词配置区域的宽度

// 拖动相关的状态
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)
const currentResizeTarget = ref<'agent' | 'config' | null>(null)

// 开始拖动Agent区域
const startResizeAgent = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = agentWidth.value
  currentResizeTarget.value = 'agent'
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.classList.add('resizing')
}

// 开始拖动Config区域
const startResizeConfig = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = configWidth.value
  currentResizeTarget.value = 'config'
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.classList.add('resizing')
}

// 处理拖动
const handleResize = (e: MouseEvent) => {
  if (!isResizing.value || !currentResizeTarget.value) return
  
  const container = document.querySelector('.admin-interface-container')
  if (!container) return
  
  const dx = e.clientX - startX.value
  const containerWidth = container.getBoundingClientRect().width
  const newWidthPercent = startWidth.value + (dx / containerWidth * 100)
  
  // 限制拖动范围在20%到60%之间
  const limitedWidth = Math.min(Math.max(newWidthPercent, 20), 60)
  
  if (currentResizeTarget.value === 'agent') {
    // 确保三个区域的总宽度不超过100%
    const maxWidth = 100 - configWidth.value - 20 // 保留至少20%给提示词区域
    agentWidth.value = Math.min(limitedWidth, maxWidth)
  } else {
    // 确保三个区域的总宽度不超过100%
    const maxWidth = 100 - agentWidth.value - 20 // 保留至少20%给提示词区域
    configWidth.value = Math.min(limitedWidth, maxWidth)
  }
}

// 停止拖动
const stopResize = () => {
  isResizing.value = false
  currentResizeTarget.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.classList.remove('resizing')
}

// 双击重置宽度
const resetWidths = () => {
  agentWidth.value = 23
  configWidth.value = 33
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
  deletePromptBlock,
  hasPlaceholder
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
      const jsonStr = cleanJsonString(e.target?.result as string)
      const config = JSON.parse(jsonStr)
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
  const newBlocks = props.promptBlocks.map((block, i) => {
    if (i === index) {
      return { text: value }
    }
    return { ...block }
  })
  emit('update:promptBlocks', newBlocks)
  // 触发配置修改事件
  emit('config-modified')
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
  insertPlaceholder(getPromptBlockPlaceholder(index), true)
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
@import './ConfigPanel.css';
</style>
