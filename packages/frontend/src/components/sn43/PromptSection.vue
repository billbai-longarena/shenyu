<!-- 提示词配置区域组件 -->
<template>
  <div class="prompt-section" :style="{ width: width + '%' }">
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
            :disabled="lastFocusedIndex === null"
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
              <el-select
                :model-value="prompt.model || 'inherit'"
                :placeholder="t('configPanel.modelSelect')"
                @update:model-value="(value) => updatePromptModel(index, value)"
              >
                <el-option
                  :label="t('configPanel.inheritGlobal')"
                  value="inherit"
                />
                <el-option
                  v-for="option in modelOptions"
                  :key="option.value"
                  :label="t(`configPanel.models.${option.value}`)"
                  :value="option.value"
                />
              </el-select>
              <el-select
                :model-value="prompt.temperature || 'inherit'"
                :placeholder="t('configPanel.temperatureSelect')"
                @update:model-value="(value) => updatePromptTemperature(index, value)"
              >
                <el-option
                  :label="t('configPanel.inheritGlobal')"
                  value="inherit"
                />
                <el-option
                  v-for="option in temperatureOptions"
                  :key="option.value"
                  :label="t(`modelParams.${option.value}`)"
                  :value="option.value"
                />
              </el-select>
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
</template>

<script setup lang="ts">
import { ref, computed, nextTick, inject, watch } from 'vue'
import { marked } from 'marked'
import { usePromptActions } from '../../composables/usePromptActions'
import { useLanguage } from '../../composables/useLanguage'
import type { ModelType } from '../../api/api-deepseekStream'

interface PromptBlock {
  text: string
  model?: ModelType | 'inherit'
  temperature?: number | 'inherit'
}

interface Props {
  width: number
  promptBlocks: PromptBlock[]
  userInputs: { [key: string]: string }
  previewText: string
  isPreviewLoading: boolean
  lastFocusedIndex: number | null
}

interface Emits {
  (e: 'update:promptBlocks', value: PromptBlock[]): void
  (e: 'update:previewText', value: string): void
  (e: 'update:isPreviewLoading', value: boolean): void
  (e: 'config-modified'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取翻译函数
const { t } = useLanguage()

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
  restoreScrollPosition
} = usePromptActions(props, emit)

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

// 模型选项
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
</script>

<style scoped>
.prompt-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.prompt-config {
  height: 100%;
  overflow-y: auto;
}

.admin-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.prompt-container {
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background-color: var(--el-bg-color-overlay);
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.prompt-input-group {
  display: flex;
  gap: 10px;
}

.prompt-input-wrapper {
  flex: 1;
}

.prompt-input {
  margin-bottom: 10px;
}

.prompt-input.invalid-prompt {
  border-color: var(--el-color-danger);
}

.prompt-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.add-prompt-button {
  width: 100%;
  margin-bottom: 20px;
}

.preview-section {
  margin-top: 30px;
}

.preview-title {
  margin-bottom: 15px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.preview-content {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 15px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.loading-icon {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.loading {
  width: 24px;
  height: 24px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(pre) {
  background-color: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  font-family: monospace;
  padding: 2px 4px;
  background-color: var(--el-fill-color-light);
  border-radius: 2px;
}
</style>
