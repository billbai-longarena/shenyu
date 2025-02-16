<template>
  <div class="execution-panel">
    <!-- 执行按钮 -->
    <el-button 
      :type="isEditing ? 'success' : 'primary'"
      class="execute-button"
      @click="executeAction"
      :disabled="isDisabled"
      :loading="isExecuting"
    >
      {{ buttonText }}
    </el-button>

    <!-- 并行模式状态 -->
    <div v-if="isParallelMode" class="parallel-mode-status" :class="{ 'fade-out': isAllBlocksCompleted }">
      <div class="block-status-list">
        <div 
          v-for="(block, index) in blockStatuses" 
          :key="index"
          class="block-status-item"
        >
          <span class="block-index">{{ t('executionPanel.blockPrefix') }}{{index + 1}}</span>
          <el-tag 
            :type="getStatusType(block.status)"
            size="small"
          >
            {{getStatusText(block.status)}}
          </el-tag>
          <span v-if="block.error" class="block-error">
            {{block.error}}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLanguage } from '../../../composables/useLanguage'

interface BlockStatus {
  status: 'pending' | 'streaming' | 'completed' | 'error'
  error?: string
}

const props = defineProps<{
  isEditing: boolean
  isParallelMode: boolean
  blockStatuses: BlockStatus[]
  isAllBlocksCompleted: boolean
  hasUserInputs: boolean
  isExecuting: boolean
  promptBlocks: { text: string }[]
  isConfigLoading: boolean
  isConfigFullyLoaded: boolean
}>()

const emit = defineEmits<{
  (e: 'execute'): void
}>()

const { t } = useLanguage()

// 检查提示词块是否包含占位符
const hasPlaceholder = (text: string): boolean => {
  return /\${(inputB\d+|promptBlock\d+)}/.test(text);
}

// 检查所有提示词块是否有效
const isAllBlocksValid = computed(() => {
  // 只有在配置完全加载完成后才检查
  if (!props.isConfigFullyLoaded) {
    return true;
  }
  return props.promptBlocks.every(block => !block.text || hasPlaceholder(block.text));
})

// 计算按钮文本
const buttonText = computed(() => {
  if (!isAllBlocksValid.value) {
    return t('executionPanel.invalidPromptBlock')
  }
  if (props.isEditing) {
    return t('executionPanel.rewrite')
  }
  if (!props.hasUserInputs) {
    return t('executionPanel.loadTemplate')
  }
  return t('executionPanel.execute')
})

// 计算按钮是否禁用
const isDisabled = computed(() => {
  // 如果配置正在加载中，直接返回true，不检查其他条件
  if (props.isConfigLoading) {
    return true;
  }

  // 只有当不在加载状态时，才检查其他条件
  return (
    !props.hasUserInputs ||
    props.isExecuting ||
    !isAllBlocksValid.value
  );
})

// 获取状态类型
const getStatusType = (status: BlockStatus['status']) => {
  switch (status) {
    case 'pending': return 'info'
    case 'streaming': return 'warning'
    case 'completed': return 'success'
    case 'error': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: BlockStatus['status']) => {
  switch (status) {
    case 'pending': return t('executionPanel.waiting')
    case 'streaming': return t('executionPanel.processing')
    case 'completed': return t('executionPanel.completed')
    case 'error': return t('executionPanel.error')
    default: return t('executionPanel.unknown')
  }
}

// 执行操作
const executeAction = () => {
  emit('execute')
}
</script>

<style scoped>
.execution-panel {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}

.parallel-mode-status {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  transition: all 0.5s ease-out;
  opacity: 1;
  transform: translateY(0);
}

.parallel-mode-status.fade-out {
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
}

.block-status-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.block-status-item .el-tag {
  min-width: 64px;
  text-align: center;
  transition: all 0.3s ease;
}

.block-status-item .el-tag.el-tag--success {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  color: #67c23a;
  font-weight: bold;
  animation: pulse 1s ease-in-out;
}

.block-status-item .el-tag.el-tag--danger {
  animation: errorPulse 2s infinite;
}

@keyframes errorPulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.block-index {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.block-error {
  color: #f56c6c;
  font-size: 0.9em;
  margin-left: 8px;
}
</style>
