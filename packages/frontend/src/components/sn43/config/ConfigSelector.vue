<template>
  <div class="config-selector">
    <div class="config-header">
      <h2 class="config-title">{{ t('configSelector.title') }}</h2>
      <div class="json-controls">
        <el-select 
          v-model="selectedFilename" 
          :placeholder="t('configSelector.selectPlaceholder')"
          @click="onSelectClick"
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
        >{{ t('configSelector.loadButton') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { useJsonFiles, type JsonFile } from '../../../composables/useJsonFiles'
import { useConfig } from '../../../composables/useConfig'
import { useLanguage } from '../../../composables/useLanguage'

const { t, currentLanguage } = useLanguage()

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
  (e: 'loading-state-change', value: boolean): void
}>()

// 加载状态
const isLoading = ref(false)

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

// 监听语言变化事件
const handleLanguageChange = async (event: Event) => {
  const customEvent = event as CustomEvent<'en' | 'zh'>
  const newLang = customEvent.detail
  console.log('[ConfigSelector] 收到语言变化事件', {
    新语言: newLang,
    当前选中文件: selectedFilename.value,
    文件列表长度: jsonFiles.value.length
  })
  
  try {
    // 先清空当前选择
    if (selectedFilename.value) {
      console.log('[ConfigSelector] 清空当前选择')
      selectedFilename.value = ''
      emit('update:model-value', '')
    }

    console.log('[ConfigSelector] 开始获取新语言的文件列表')
    await fetchJsonFiles()
    console.log('[ConfigSelector] 文件列表获取成功', {
      新文件列表长度: jsonFiles.value.length,
      文件列表: jsonFiles.value.map(f => f.filename)
    })
  } catch (error) {
    console.error('[ConfigSelector] 获取文件列表失败:', error)
    ElMessage.error(t('configSelector.loadError'))
  }
}

// 监听语言变化（通过watch和自定义事件两种方式）
watch(currentLanguage, async (newLang, oldLang) => {
  console.log('[ConfigSelector] 语言变化监听触发', {
    旧语言: oldLang,
    新语言: newLang,
    当前选中文件: selectedFilename.value,
    文件列表长度: jsonFiles.value.length
  })
  
  try {
    // 先清空当前选择
    if (selectedFilename.value) {
      console.log('[ConfigSelector] 清空当前选择')
      selectedFilename.value = ''
      emit('update:model-value', '')
    }

    console.log('[ConfigSelector] 开始获取新语言的文件列表')
    await fetchJsonFiles()
    console.log('[ConfigSelector] 文件列表获取成功', {
      新文件列表长度: jsonFiles.value.length,
      文件列表: jsonFiles.value.map(f => f.filename)
    })
  } catch (error) {
    console.error('[ConfigSelector] 获取文件列表失败:', error)
    ElMessage.error(t('configSelector.loadError'))
  }
}, { immediate: true })

// 添加和移除事件监听器
onMounted(() => {
  window.addEventListener('language-changed', handleLanguageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('language-changed', handleLanguageChange)
})

// 点击下拉框时获取最新文件列表
const onSelectClick = async () => {
  if (!jsonFiles.value.length) {
    await fetchJsonFiles()
  }
}

// 监听文件列表变化
watch(jsonFiles, () => {
  // 如果当前选中的文件不在新的文件列表中，清空选择
  if (selectedFilename.value && !jsonFiles.value.find((f: JsonFile) => f.filename === selectedFilename.value)) {
    selectedFilename.value = ''
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
    ElMessage.warning(t('configSelector.selectFirst'))
    return
  }

  isLoading.value = true
  emit('loading-state-change', true)

  try {
    const file = jsonFiles.value.find((f: JsonFile) => f.filename === selectedFilename.value)
    if (!file) {
      throw new Error(t('configSelector.fileNotFound'))
    }
    const timestamp = new Date().getTime()
    const response = await fetch(`/${file.encodedFilename}?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    if (!response.ok) {
      throw new Error(t('configSelector.loadError'))
    }

    const config = await response.json()
    await importConfig(config, 1) // 等待导入完成
    ElMessage.success(t('configSelector.loadSuccess'))
    emit('config-loaded') // 只在完全加载后触发
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error(t('configSelector.loadError'))
  } finally {
    isLoading.value = false
    emit('loading-state-change', false)
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
