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
          @update:admin-inputs="$emit('update:adminInputs', $event)"
          @update:user-inputs="$emit('update:userInputs', $event)"
          @update:prompt-blocks="$emit('update:promptBlocks', $event)"
          @update:input-counter="$emit('update:inputCounter', $event)"
        />
        
        <InputPanel
          :user-inputs="userInputs"
          :admin-inputs="adminInputs"
          @update:user-inputs="$emit('update:userInputs', $event)"
        />
        
        <ExecutionPanel
          :is-editing="isEditing"
          :is-parallel-mode="isParallelMode"
          :block-statuses="blockStatuses"
          :is-all-blocks-completed="isAllBlocksCompleted"
          :has-user-inputs="Object.keys(userInputs).length > 0"
          :is-executing="isExecuting"
          :prompt-blocks="promptBlocks"
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

// Props定义
const props = withDefaults(defineProps<{
  userInputs: { [key: string]: string }
  adminInputs: { [key: string]: string }
  promptBlocks: { text: string }[]
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

// 配置加载完成的处理
const onConfigLoaded = () => {
  // 可以在这里添加额外的处理逻辑
}

// 执行用户输入
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
