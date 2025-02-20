<!-- 保持原有的template部分 -->
<template>
  <div class="admin-interface-container">
    <!-- Agent生成器区域 -->
    <AgentSection
      :width="agentWidth"
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
      @config-modified="emit('config-modified')"
    />

    <!-- 第一个拖动分隔条 -->
    <div 
      class="resize-handle"
      @mousedown="startResizeAgent"
      @dblclick="resetWidths"
    ></div>

    <!-- 用户输入配置区域 -->
    <ConfigSection
      :width="configWidth"
      :admin-inputs="adminInputs"
      :user-inputs="userInputs"
      :prompt-blocks="promptBlocks"
      :input-counter="inputCounter"
      :last-focused-index="lastFocusedIndex"
      :preview-text="previewText"
      :is-preview-loading="isPreviewLoading"
      @update:admin-inputs="updateAdminInputs"
      @update:user-inputs="updateUserInputs"
      @update:prompt-blocks="updatePromptBlocks"
      @update:input-counter="updateInputCounter"
      @update:preview-text="updatePreviewText"
      @update:is-preview-loading="updateIsPreviewLoading"
      @config-modified="emit('config-modified')"
    />

    <!-- 第二个拖动分隔条 -->
    <div 
      class="resize-handle"
      @mousedown="startResizeConfig"
      @dblclick="resetWidths"
    ></div>

    <!-- 提示词配置区域 -->
    <PromptSection
      :width="promptWidth"
      :prompt-blocks="promptBlocks"
      :user-inputs="userInputs"
      :preview-text="previewText"
      :is-preview-loading="isPreviewLoading"
      :last-focused-index="lastFocusedIndex"
      @update:prompt-blocks="updatePromptBlocks"
      @update:preview-text="updatePreviewText"
      @update:is-preview-loading="updateIsPreviewLoading"
      @config-modified="emit('config-modified')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed, watch, nextTick, inject } from 'vue'
import { marked } from 'marked'
import { Loading } from '@element-plus/icons-vue'
import AgentSection from './AgentSection.vue'
import ConfigSection from './ConfigSection.vue'
import PromptSection from './PromptSection.vue'
import { useVersionConfig } from '../../composables/useVersionConfig'
import { useLanguage } from '../../composables/useLanguage'
import { useAgentActions } from '../../composables/useAgentActions'
import { useConfigActions } from '../../composables/useConfigActions'
import { usePromptActions } from '../../composables/usePromptActions'
import { useLayoutActions } from '../../composables/useLayoutActions'
import type { ModelType } from '../../api/api-deepseekStream'

interface PromptBlock {
    text: string
    model?: ModelType | 'inherit'
    temperature?: number | 'inherit'
}

interface Props {
    adminInputs: { [key: string]: string }
    userInputs: { [key: string]: string }
    promptBlocks: PromptBlock[]
    inputCounter: number
    previewText: string
    isPreviewLoading: boolean
}

const props = defineProps<Props>()

interface Emits {
    (e: 'update:adminInputs', value: { [key: string]: string }): void
    (e: 'update:userInputs', value: { [key: string]: string }): void
    (e: 'update:promptBlocks', value: PromptBlock[]): void
    (e: 'update:inputCounter', value: number): void
    (e: 'update:previewText', value: string): void
    (e: 'update:isPreviewLoading', value: boolean): void
    (e: 'config-modified'): void
}

const emit = defineEmits<Emits>()

// 获取翻译函数
const { t } = useLanguage()

// 版本管理相关
const {
    versionDescription,
    versionHistory,
    currentVersionIndex,
    formatTimestamp,
    loadVersion,
    exportConfig,
    importConfig
} = useVersionConfig(props, emit)

// AI智能体生成相关
const {
    isGenerating,
    textareaGenerateAgent,
    pathInput,
    generateAIAgent,
    generateFromText
} = useAgentActions(props, emit, importConfig)

// 提示词相关
const {
    lastFocusedIndex,
    promptRefs,
    handlePromptFocus,
    setPromptRef,
    updatePromptText,
    updatePromptModel,
    updatePromptTemperature,
    addPromptBlock,
    insertPromptBlock,
    previewPrompt,
    deletePromptBlock,
    hasPlaceholder,
    saveScrollPosition,
    restoreScrollPosition,
    insertPlaceholder
} = usePromptActions(props, emit)

// 配置管理相关
const {
    fileInput,
    handleFileUpload,
    handleExportConfig,
    addUserInput,
    deleteAdminInput,
    handleAdminInput,
    handleAdminInputInsert
} = useConfigActions(props, emit, {
    exportConfig,
    importConfig,
    versionDescription
}, {
    insertPlaceholder
})

// 布局相关
const {
    agentWidth,
    configWidth,
    promptWidth,
    startResizeAgent,
    startResizeConfig,
    resetWidths,
    cleanup: cleanupLayout
} = useLayoutActions()

// 组件卸载时清理
onUnmounted(() => {
    cleanupLayout()
})

// Markdown配置
marked.setOptions({
    breaks: true,
    gfm: true,
    pedantic: false
})

// 预览相关
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

// 监听adminInputs的变化
watch(() => props.adminInputs, (newAdminInputs) => {
    // 创建一个全新的空的 userInputs 对象
    const newUserInputs: { [key: string]: string } = {}
    
    // 遍历所有的 adminInputs，为每个 inputB 创建对应的 inputA
    Object.entries(newAdminInputs).forEach(([key, value]) => {
        const userKey = `inputA${key.replace('inputB', '')}`
        let defaultValue = ''
        
        // 如果有 def 标签就使用其中的值，没有就保持空字符串
        const match = value.match(/<def>(.*?)<\/def>/)
        if (match) {
            defaultValue = match[1]
        }
        
        newUserInputs[userKey] = defaultValue
    })
    
    // 更新所有 userInputs
    emit('update:userInputs', newUserInputs)
}, { immediate: true, deep: true })

// 提示词区域引用
const promptSection = ref<HTMLElement | null>(null)

// 复用App.vue中的模型和温度选项
const modelOptions = ref([
    { label: 'kimi-8k', value: 'kimi' },
    { label: '火山DeepseekV3', value: 'volcesDeepseek' },
    { label: '火山DeepseekR1', value: 'volcesDeepseekR1' },
    { label: 'Ali DeepSeekV3', value: 'alideepseekv3' },
    { label: '腾讯云DeepseekV3', value: 'tencentDeepseek' },
    { label: 'deepseek V3', value: 'deepseek' },
    { label: '零一万物', value: 'yiwan' },
    { label: '硅基流动DeepseekV3', value: 'siliconDeepseek' },
    { label: '百度DeepSeekV3', value: 'baiduDeepseek' },
    { label: 'Qwen 2.5 Plus', value: 'qwen-turbo-latest' },
    { label: 'Ali DeepSeek R1', value: 'alideepseekr1' },
    { label: 'MiniMax-Text-01', value: 'minimax-text' }
])

const temperatureOptions = computed(() => [
    { label: t('modelParams.conservative'), value: 'conservative' },
    { label: t('modelParams.balanced'), value: 'balanced' },
    { label: t('modelParams.creative'), value: 'creative' }
])

// 获取全局模型和温度设置
const globalModel = inject('selectedModel')
const globalTemperature = inject('selectedTemperature')

// 更新函数
const updateAdminInputs = (value: { [key: string]: string }) => {
  emit('update:adminInputs', value)
}

const updateUserInputs = (value: { [key: string]: string }) => {
  emit('update:userInputs', value)
}

const updatePromptBlocks = (value: PromptBlock[]) => {
  emit('update:promptBlocks', value)
}

const updateInputCounter = (value: number) => {
  emit('update:inputCounter', value)
}

const updatePreviewText = (value: string) => {
  emit('update:previewText', value)
}

const updateIsPreviewLoading = (value: boolean) => {
  emit('update:isPreviewLoading', value)
}
</script>

<style scoped>
/* 全局布局样式 */
.admin-interface-container {
  display: flex;
  height: 100%;
  position: relative;
  background-color: var(--el-bg-color);
}

/* 分隔条样式 */
.resize-handle {
  width: 4px;
  background-color: var(--el-border-color);
  cursor: col-resize;
  transition: background-color 0.3s;
}

.resize-handle:hover {
  background-color: var(--el-color-primary);
}
</style>
