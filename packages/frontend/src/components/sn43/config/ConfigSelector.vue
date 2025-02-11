<template>
  <div class="config-selector">
    <div class="config-header">
      <h2 class="config-title">输入区域</h2>
      <div class="json-controls">
        <el-select 
          v-model="selectedFilename" 
          placeholder="选择配置文件"
          @focus="fetchJsonFiles"
          :disabled="isConfigModified || isEditing"
        >
          <el-option
            v-for="file in jsonFiles"
            :key="file.filename"
            :label="file.filename.replace('.json', '')"
            :value="file.filename"
          />
        </el-select>
        <el-button 
          type="primary" 
          @click="loadConfig"
          :disabled="isConfigModified || isEditing"
        >载入</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useJsonFiles } from '../../../composables/useJsonFiles'
import { useConfig } from '../../../composables/useConfig'

const props = defineProps<{
  modelValue: string
  isConfigModified: boolean
  isEditing: boolean
  adminInputs: { [key: string]: string }
  userInputs: { [key: string]: string }
  promptBlocks: { text: string }[]
  inputCounter: number
}>()

const emit = defineEmits<{
  (e: 'update:model-value', value: string): void
  (e: 'config-loaded'): void
  (e: 'update:adminInputs', value: { [key: string]: string }): void
  (e: 'update:userInputs', value: { [key: string]: string }): void
  (e: 'update:promptBlocks', value: { text: string }[]): void
  (e: 'update:inputCounter', value: number): void
}>()

// 配置相关
const { jsonFiles, fetchJsonFiles } = useJsonFiles()

// 本地状态
const selectedFilename = ref<string>('')

// 监听selectedFilename的变化
watch(() => selectedFilename.value, (newValue) => {
  emit('update:model-value', newValue)
})

// 监听props.modelValue的变化
watch(() => props.modelValue, async (newValue) => {
  if (newValue && jsonFiles.value.length === 0) {
    // 如果有初始值但文件列表为空，先获取文件列表
    await fetchJsonFiles()
  }
  selectedFilename.value = newValue
}, { immediate: true })

// 组件挂载时获取文件列表
onMounted(async () => {
  if (props.modelValue) {
    await fetchJsonFiles()
  }
})

// 初始化配置相关功能
const { importConfig } = useConfig(
  {
    adminInputs: props.adminInputs,
    userInputs: props.userInputs,
    promptBlocks: props.promptBlocks,
    inputCounter: props.inputCounter
  },
  emit
)

// 加载选中的JSON配置
const loadConfig = async () => {
  if (!selectedFilename.value) {
    ElMessage.warning('请先选择配置文件')
    return
  }

  try {
    const file = jsonFiles.value.find(f => f.filename === selectedFilename.value)
    if (!file) {
      throw new Error('找不到选中的文件')
    }
    const response = await fetch(`/${file.encodedFilename}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    if (!response.ok) {
      throw new Error('加载配置失败')
    }

    const config = await response.json()
    importConfig(config)
    ElMessage.success('配置加载成功')
    emit('config-loaded')
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败')
  }
}
</script>

<style scoped>
.config-selector {
  margin-bottom: 20px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.config-title {
  color: #1a1a1a;
  font-weight: 600;
  margin: 0;
  line-height: 32px;
}

.json-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.json-controls :deep(.el-select) {
  width: 200px;
}
</style>
