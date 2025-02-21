<template>
  <div class="admin-interface-container">
    <!-- Agent生成器区域 -->
    <div class="agent-section" :style="{ width: agentWidth + '%' }">
      <div class="agent-section-content">
        <h2 class="admin-title">{{ t('configPanel.agentTitle') }}</h2>
        <!-- AI智能体生成区域 -->
        <div class="agent-generator">
          <el-input type="textarea" v-model="textareaGenerateAgent" :rows="3"
            :placeholder="t('configPanel.agentInputPlaceholder')" class="agent-input" />
          <el-button type="primary" class="generate-button" @click="generateAIAgent" :disabled="isGenerating"
            :loading="isGenerating">
            {{ t('configPanel.generateAgentButton') }}
          </el-button>
        </div>

        <!-- 路径输入和生成控件区域 -->
        <div class="path-input-section">
          <el-input type="textarea" v-model="pathInput" :rows="3" :placeholder="t('configPanel.pathInputPlaceholder')"
            class="path-input" />
          <el-button type="primary" class="generate-button" @click="generateFromText" :disabled="!pathInput.trim()">
            {{ t('configPanel.generateControls') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 第一个拖动分隔条 -->
    <div class="resize-handle" @mousedown="startResizeAgent" @dblclick="resetWidths"></div>

    <!-- 用户输入配置区域 -->
    <div class="config-section" :style="{ width: configWidth + '%' }">
      <div class="config-section-content">
        <div class="config-inputs-container">
          <h2 class="admin-title">{{ t('configPanel.userInputConfig') }}</h2>

          <!-- 配置操作按钮 -->
          <div class="config-actions">
            <el-input v-model="versionDescription" :placeholder="t('configPanel.versionManagement.inputPlaceholder')"
              class="version-input" />
            <el-button type="danger" @click="handleExportConfig">
              {{ t('configPanel.saveExport') }}
            </el-button>
            <el-button type="primary" @click="fileInput?.click()">
              {{ t('configPanel.importJson') }}
            </el-button>
          </div>

          <!-- 隐藏的文件输入框 -->
          <input type="file" ref="fileInput" style="display: none" accept=".json" @change="handleFileUpload" />

          <!-- 动态生成的配置输入框 -->
          <div v-for="(value, key) in adminInputs" :key="key" class="input-group">
            <div class="input-with-label">
              <el-button type="primary" link class="insert-button" @click="insertPlaceholder(String(key))"
                :disabled="lastFocusedIndex === null">
                {{ t('configPanel.insert') }}
              </el-button>
              <el-input v-model="adminInputs[key]" :placeholder="t('configPanel.inputPlaceholder') + key"
                @input="(value: string) => handleAdminInput(String(key), value)" />
              <el-button type="danger" link @click="deleteAdminInput(String(key))">
                {{ t('configPanel.delete') }}
              </el-button>
            </div>
          </div>
          <!-- 增加用户输入按钮 -->
          <div class="button-group">
            <el-button type="primary" class="add-input-button" @click="addUserInput">
              {{ t('configPanel.addUserInput') }}
            </el-button>
          </div>

          <!-- 版本历史列表 -->
          <div class="version-history" v-if="versionHistory.length">
            <h3>{{ t('configPanel.versionManagement.historyTitle') }}</h3>
            <el-card v-for="(version, index) in versionHistory" :key="version.version"
              :class="{ 'current-version': currentVersionIndex === index }" class="version-card">
              <div class="version-item">
                <div class="version-info">
                  <span class="version-time">{{ formatTimestamp(version.timestamp) }}</span>
                  <span class="version-desc">{{ version.description }}</span>
                </div>
                <el-button type="primary" size="small" style="padding: 4px 8px; height: 24px"
                  @click="loadVersion(index)">
                  {{ t('configPanel.versionManagement.loadVersion') }}
                </el-button>
              </div>
            </el-card>
          </div>

          <!-- 预览区域 -->
          <div class="preview-section">
            <h3 class="preview-title">{{ t('configPanel.previewTitle') }}</h3>
            <div class="preview-content" ref="previewContent">
              <div class="messages">
                <div class="message">
                  <div class="assistant-message">
                    <div class="loading-icon" v-if="isPreviewLoading">
                      <svg viewBox="0 0 1024 1024" class="loading">
                        <path
                          d="M512 64q14.016 0 23.008 8.992T544 96v192q0 14.016-8.992 23.008T512 320t-23.008-8.992T480 288V96q0-14.016 8.992-23.008T512 64zm0 640q14.016 0 23.008 8.992T544 736v192q0 14.016-8.992 23.008T512 960t-23.008-8.992T480 928V736q0-14.016 8.992-23.008T512 704zm448-192q0 14.016-8.992 23.008T928 544H736q-14.016 0-23.008-8.992T704 512t8.992-23.008T736 480h192q14.016 0 23.008 8.992T960 512zm-640 0q0 14.016-8.992 23.008T288 544H96q-14.016 0-23.008-8.992T64 512t8.992-23.008T96 480h192q14.016 0 23.008 8.992T320 512zM195.008 195.008q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zm454.016 454.016q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zM828.992 195.008q8.992 10.016 8.992 23.008t-8.992 22.016l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992zM375.008 649.024q8.992 10.016 8.992 22.016t-8.992 23.008l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992z" />
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
    <div class="resize-handle" @mousedown="startResizeConfig" @dblclick="resetWidths"></div>

    <!-- 提示词配置区域 -->
    <div class="prompt-section" ref="promptSection" :style="{ width: promptWidth + '%' }">
      <div class="prompt-config">
        <h2 class="admin-title">{{ t('configPanel.promptConfig') }}</h2>

        <!-- 提示词输入区域 -->
        <div v-for="(prompt, index) in promptBlocks" :key="index" class="prompt-container">
          <div class="prompt-input-group">
            <el-button type="primary" link class="insert-button" @click="insertPromptBlock(index)"
              :disabled="lastFocusedIndex === null || !canInsertPromptBlock(index, lastFocusedIndex)">
              {{ t('configPanel.insert') }}
            </el-button>
            <div class="prompt-input-wrapper">
              <el-input :model-value="prompt.text" type="textarea" :rows="4"
                :placeholder="t('configPanel.inputPromptPlaceholder')"
                :class="['prompt-input', { 'invalid-prompt': prompt.text && !hasPlaceholder(prompt.text) }]"
                @focus="handlePromptFocus(index)" @input="(value) => {
                  updatePromptText(index, value);
                  nextTick(() => {
                    emit('config-modified');
                  });
                }" :ref="(el: any) => setPromptRef(el, index)" />
              <div class="prompt-actions">
                <el-button type="primary" link class="preview-button" @click="previewPrompt(index)"
                  :disabled="!!(prompt.text && !hasPlaceholder(prompt.text))">
                  {{ prompt.text && !hasPlaceholder(prompt.text) ? t('configPanel.invalidPromptBlockPreview') :
                    t('configPanel.preview') }}
                </el-button>
                <el-button type="danger" link @click="deletePromptBlock(index)">
                  {{ t('configPanel.delete') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 增加提示词块按钮 -->
        <el-button type="primary" class="add-prompt-button" @click="addPromptBlock">
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
import { useVersionConfig } from '../../composables/useVersionConfig'
import { usePrompt } from '../../composables/usePrompt'
import { useLanguage } from '../../composables/useLanguage'
import { useStreamResponse } from '../../composables/useStreamResponse'
import { setTemperature } from '../../api/api-deepseekStream'
import { apiAIAgentService } from '../../services/api-ai-agent'

interface Props {
  adminInputs: { [key: string]: string }
  userInputs: { [key: string]: string }
  promptBlocks: { text: string }[]
  inputCounter: number
  previewText: string
  isPreviewLoading: boolean
}

// AI智能体生成相关
const textareaGenerateAgent = ref('')
const isGenerating = ref(false)
const { handleStreamResponse } = useStreamResponse()
const selectedModel = inject('selectedModel') as any
const selectedTemperature = inject('selectedTemperature') as any

// 生成AI智能体
const generateAIAgent = async () => {
  if (!textareaGenerateAgent.value.trim()) {
    ElMessage.warning(t('configPanel.agentInputPlaceholder'))
    return
  }

  isGenerating.value = true

  // 确保AI Agent服务已初始化
  try {
    await apiAIAgentService.initialize()
  } catch (error) {
    console.error('初始化AI Agent服务失败:', error)
    ElMessage.error(t('configPanel.initializeError'))
    isGenerating.value = false
    return
  }
  try {
    setTemperature(0)
    selectedTemperature.value = 0

    const prompts: string[] = []
    let i = 1
    while (true) {
      const key = `configPanel.agentPromptTemplate${i}`
      const template = t(key)
      if (!template || template === key) {
        break
      }
      prompts.push(template.replace('${input}', textareaGenerateAgent.value))
      i++
    }

    emit('update:adminInputs', {})
    emit('update:promptBlocks', [])
    emit('update:inputCounter', 0)

    pathInput.value = ''

    const promptResults: string[] = []

    for (let i = 0; i < prompts.length; i++) {
      let currentPrompt = prompts[i]

      for (let j = 0; j < promptResults.length; j++) {
        currentPrompt = currentPrompt.replace(
          `\${promptResults${j + 1}}`,
          promptResults[j]
        )
      }

      const isLastPrompt = i === prompts.length - 1

      if (isLastPrompt) {
        await handleStreamResponse(
          currentPrompt,
          async (chunk: string, processedChunk: string) => {
            if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
              pathInput.value += processedChunk
            }
          }
        )
      } else {
        const response = await handleStreamResponse(currentPrompt)
        promptResults.push(response.content)
      }
    }

    await generateFromText()

    // 保存AI Agent配置
    await apiAIAgentService.saveAgent(
      textareaGenerateAgent.value,
      pathInput.value,
      selectedModel.value,
      selectedTemperature.value
    )
  } catch (error) {
    console.error('生成AI智能体失败:', error)
    ElMessage.error(t('configPanel.generateAgentError'))
  } finally {
    isGenerating.value = false
  }
}

// PDF输入计数器
const pdfInputCounter = ref(0)

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
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// 从文本生成控件
const generateFromText = async () => {
  const input = pathInput.value
  try {
    const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g
    const matches = input.match(jsonRegex)

    if (!matches || matches.length === 0) {
      ElMessage.warning(t('configPanel.noValidJsonFound'))
      return
    }

    const cleanedJson = cleanJsonString(matches[0])
    const config = JSON.parse(cleanedJson)

    if (config.adminInputs) {
      Object.keys(config.adminInputs).forEach(key => {
        const value = config.adminInputs[key];
        config.adminInputs[key] = value.replace(/<def>(.*?)<def>/g, '<def>$1</def>');
      });
    }

    let configToImport = config;

    // 检查是否是旧格式（直接包含adminInputs和promptBlocks）
    if (config.adminInputs && config.promptBlocks && !config.currentVersion) {
      // 将 promptBlocks 对象转换为数组格式
      const promptBlocksArray = Object.values(config.promptBlocks).map((text: any) => ({
        text: typeof text === 'string' ? text : text.text
      }));

      // 转换为新格式
      configToImport = {
        currentVersion: {
          adminInputs: config.adminInputs,
          promptBlocks: promptBlocksArray
        },
        versionHistory: [{
          version: Date.now().toString(),
          description: '导入旧版本配置',
          timestamp: new Date().toISOString(),
          adminInputs: config.adminInputs,
          promptBlocks: promptBlocksArray
        }]
      }
    }

    const result = await importConfig(configToImport)
    if (result.success) {
      emit('config-modified')
      ElMessage.success(t('configPanel.controlsGenerated'))
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('生成控件失败:', error)
    ElMessage.error(t('configPanel.generateError'))
  }
}

const fileInput = ref<HTMLInputElement | null>(null)

marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false
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
const agentWidth = ref(23)
const configWidth = ref(33)
const promptWidth = computed(() => 100 - agentWidth.value - configWidth.value)

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

  const limitedWidth = Math.min(Math.max(newWidthPercent, 20), 60)

  if (currentResizeTarget.value === 'agent') {
    const maxWidth = 100 - configWidth.value - 20
    agentWidth.value = Math.min(limitedWidth, maxWidth)
  } else {
    const maxWidth = 100 - agentWidth.value - 20
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

// 监听adminInputs的变化
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

// 版本管理相关
const {
  versionDescription,
  versionHistory,
  currentVersionIndex,
  formatTimestamp,
  loadVersion,
  exportConfig: exportVersionConfig,
  importConfig: importVersionConfig
} = useVersionConfig(props, emit)

// 导出配置
const exportConfig = exportVersionConfig
// 导入配置
const importConfig = importVersionConfig

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const jsonStr = cleanJsonString(e.target?.result as string)
      const config = JSON.parse(jsonStr)
      const result = await importConfig(config)

      if (result.success) {
        ElMessage.success(result.message)
      } else {
        ElMessage.error(result.message)
      }
    } catch (error) {
      console.error('导入配置失败:', error)
      ElMessage.error(t('configPanel.importError'))
    }

    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
  reader.readAsText(file)
}

// 处理导出配置
const handleExportConfig = async () => {
  // 如果版本描述为空，自动生成一个包含日期的版本描述
  if (!versionDescription.value.trim()) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    versionDescription.value = `配置_${year}${month}${day}`
  }

  const result = await exportConfig()
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.warning(result.message)
  }
}

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
  const match = value.match(/<def>(.*?)<\/def>/)
  if (match) {
    const userKey = `inputA${key.replace('inputB', '')}`
    const defaultValue = match[1]
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

  const userKey = `inputA${newCounter}`
  const newUserInputs = { ...props.userInputs }
  newUserInputs[userKey] = ''
  emit('update:userInputs', newUserInputs)

  emit('config-modified')
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

  insertPlaceholder(getPromptBlockPlaceholder(index))
  emit('config-modified')
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

    const newAdminInputs = Object.fromEntries(
      Object.entries(props.adminInputs).filter(([k]) => k !== key)
    )
    emit('update:adminInputs', newAdminInputs)

    const userKey = `inputA${key.replace('inputB', '')}`
    const newUserInputs = Object.fromEntries(
      Object.entries(props.userInputs).filter(([k]) => k !== userKey)
    )
    emit('update:userInputs', newUserInputs)

    emit('config-modified')

    ElMessage.success(t('configPanel.deleteSuccess'))
  } catch (error) {
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
