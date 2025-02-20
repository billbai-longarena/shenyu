<!-- AI智能体生成区域组件 -->
<template>
  <div class="agent-section" :style="{ width: width + '%' }">
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
</template>

<script setup lang="ts">
import { useAgentActions } from '../../composables/useAgentActions'
import { useLanguage } from '../../composables/useLanguage'

interface Props {
  width: number
  adminInputs: { [key: string]: string }
  userInputs: { [key: string]: string }
  promptBlocks: any[]
  inputCounter: number
  previewText: string
  isPreviewLoading: boolean
}

interface Emits {
  (e: 'update:adminInputs', value: { [key: string]: string }): void
  (e: 'update:userInputs', value: { [key: string]: string }): void
  (e: 'update:promptBlocks', value: any[]): void
  (e: 'update:inputCounter', value: number): void
  (e: 'update:previewText', value: string): void
  (e: 'update:isPreviewLoading', value: boolean): void
  (e: 'config-modified'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取翻译函数
const { t } = useLanguage()

// AI智能体生成相关
const {
  isGenerating,
  textareaGenerateAgent,
  pathInput,
  generateAIAgent,
  generateFromText
} = useAgentActions(props, emit, async (config: any) => {
  // 处理导入配置
  if (config.currentVersion) {
    emit('update:adminInputs', config.currentVersion.adminInputs || {})
    emit('update:promptBlocks', config.currentVersion.promptBlocks || [])
    emit('update:inputCounter', Object.keys(config.currentVersion.adminInputs || {}).length)
    return { success: true }
  }
  return { success: false, message: t('configPanel.importError') }
})
</script>

<style scoped>
.agent-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--el-border-color);
  padding: 20px;
  box-sizing: border-box;
}

.agent-section-content {
  height: 100%;
  overflow-y: auto;
}

.admin-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.agent-generator,
.path-input-section {
  margin-bottom: 20px;
}

.agent-input,
.path-input {
  margin-bottom: 10px;
}

.generate-button {
  width: 100%;
}
</style>
