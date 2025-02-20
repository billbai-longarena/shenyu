<template>
  <ResizableLayout :initial-left-width="400" :min-width="200">
    <template #left>
      <div class="left-container">
          <ConfigSelector
          :model-value="selectedJsonFile"
          @update:model-value="newValue => $emit('update:selectedJsonFile', newValue)"
          :is-config-modified="isConfigModified"
          :is-editing="isEditing"
          :admin-inputs="adminInputs"
          :user-inputs="userInputs"
          :prompt-blocks="promptBlocks"
          :input-counter="inputCounter"
          @config-loaded="onConfigLoaded"
          @loading-state-change="onLoadingStateChange"
          @update:admin-inputs="$emit('update:adminInputs', $event)"
          @update:user-inputs="$emit('update:userInputs', $event)"
          @update:prompt-blocks="$emit('update:promptBlocks', $event)"
          @update:input-counter="$emit('update:inputCounter', $event)"
        />
        
        <InputPanel
          :user-inputs="userInputs"
          :admin-inputs="adminInputs"
          @update:user-inputs="$emit('update:userInputs', $event)"
          @pdfParsingStatus="handlePdfParsingStatus"
        />
        
        <ExecutionPanel
          :is-editing="isEditing"
          :is-parallel-mode="isParallelMode"
          :block-statuses="blockStatuses"
          :is-all-blocks-completed="isAllBlocksCompleted"
          :has-user-inputs="Object.keys(userInputs).length > 0"
          :is-executing="isExecuting || isPdfParsing"
          :prompt-blocks="promptBlocks"
          :is-config-loading="isConfigLoading"
          :is-config-fully-loaded="isConfigFullyLoaded"
          @execute="executeUserInputs"
        />
      </div>
    </template>
    
    <template #right>
      <OutputPanel
        :block-contents="blockContents"
        :block-statuses="blockStatuses"
      />
    </template>
  </ResizableLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ResizableLayout from './layout/ResizableLayout.vue'
import ConfigSelector from './config/ConfigSelector.vue'
import InputPanel from './input/InputPanel.vue'
import ExecutionPanel from './execution/ExecutionPanel.vue'
import OutputPanel from './output/OutputPanel.vue'
import { useExecuteButton } from '../../composables/useExecuteButton.js'
import { useLanguage } from '../../composables/useLanguage'
import { ElMessage } from 'element-plus'
import { getCurrentModel, getCurrentTemperature, setTemperature } from '../../api/api-deepseekStream'
import type { ModelType } from '../../api/api-deepseekStream'
import { useModelConfig } from '../../composables/useModelConfig'

// Props定义
const props = withDefaults(defineProps<{
  userInputs: { [key: string]: string }
  adminInputs: { [key: string]: string }
  promptBlocks: { 
    text: string
    model?: ModelType | 'inherit'
    temperature?: number | 'inherit'
  }[]
  isEditing: boolean
  outputResult?: string
  inputCounter?: number
  isConfigModified: boolean
  selectedJsonFile?: string
}>(), {
  inputCounter: 0,
  selectedJsonFile: ''
})

// Emits定义
const emit = defineEmits<{
  (e: 'update:userInputs', value: { [key: string]: string }): void
  (e: 'execution-complete', messages: any[]): void
  (e: 'update:adminInputs', value: { [key: string]: string }): void
  (e: 'update:promptBlocks', value: { text: string }[]): void
  (e: 'update:inputCounter', value: number): void
  (e: 'update:selectedJsonFile', value: string): void
}>()

// 获取翻译函数
const { t } = useLanguage()

// PDF解析状态
const isPdfParsing = ref(false)

// 处理PDF解析状态变化
const handlePdfParsingStatus = (status: boolean) => {
  isPdfParsing.value = status
}

// 执行相关
const { 
  isExecuting,
  isParallelMode, 
  isAllBlocksCompleted,
  blockStatuses,
  blockContents,
  executeUserInputs: execUserInputs,
  setBlockContents
} = useExecuteButton()

// 监听outputResult变化
watch(() => props.outputResult, (newValue) => {
  if (newValue) {
    // 将outputResult按分隔符分割成数组
    const contents = newValue.split('<hr class="block-divider">').map(content => {
      // 移除div标签和markdown渲染
      return content
        .replace(/<div[^>]*>|<\/div>/g, '')
        .replace(/^<p>|<\/p>$/g, '')
        .trim();
    });
    // 更新blockContents
    setBlockContents(contents);
  } else {
    // 如果outputResult为空，清空blockContents
    setBlockContents([]);
  }
}, { immediate: true })

// 配置加载状态
const isConfigLoading = ref(false)
const isConfigFullyLoaded = ref(false)

// 配置加载状态变化处理
const onLoadingStateChange = (state: boolean) => {
  isConfigLoading.value = state
  if (state) {
    isConfigFullyLoaded.value = false
  }
}

// 配置加载完成的处理
const onConfigLoaded = () => {
  isConfigFullyLoaded.value = true
}

// 执行用户输入
const { getModelMaxTokens } = useModelConfig()

const executeUserInputs = async () => {
  try {
    const result = await execUserInputs(
      props.userInputs,
      props.adminInputs,
      props.promptBlocks,
      async (blockIndex: number, chunk: string) => {
        // 不需要手动更新状态，因为useExecution已经处理了状态更新
      }
    )
    
    if (result) {
      // 打印每个promptBlock的参数
      console.log('所有任务执行完成，打印每个promptBlock的参数：')
      for (let i = 0; i < props.promptBlocks.length; i++) {
        const block = props.promptBlocks[i]
        const model = block.model === 'inherit' || !block.model ? getCurrentModel() : block.model
        const temperature = block.temperature === 'inherit' || block.temperature === undefined ? getCurrentTemperature() : block.temperature
        const maxTokens = await getModelMaxTokens(model as ModelType)
        console.log(`PromptBlock ${i + 1}:`, {
          model,
          temperature,
          maxTokens
        })
      }
      
      emit('execution-complete', result.messages)
    }
  } catch (error) {
    console.error('执行错误:', error)
    ElMessage.error(t('userInterface.executionError'))
  }
}
</script>

<style scoped>
.left-container {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow-y: auto;
}
</style>
