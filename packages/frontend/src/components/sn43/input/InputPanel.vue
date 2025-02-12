<template>
  <div class="input-panel">
    <div v-for="(value, key) in localUserInputs" :key="String(key)" class="input-group">
      <div class="input-with-label">
        <span class="input-label">{{ getAdminInputValue(String(key)) }}</span>
        <el-input 
          v-model="localUserInputs[key]"
          :placeholder="t('inputPanel.inputPlaceholder') + key"
          @input="updateUserInputs"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLanguage } from '../../../composables/useLanguage'

const { t } = useLanguage()

const props = defineProps<{
  userInputs: { [key: string]: string }
  adminInputs: { [key: string]: string }
}>()

const emit = defineEmits<{
  (e: 'update:userInputs', value: { [key: string]: string }): void
}>()

// 本地用户输入状态
const localUserInputs = ref<{ [key: string]: string }>({})

// 监听props.userInputs的变化
watch(() => props.userInputs, (newValue) => {
  localUserInputs.value = { ...newValue }
}, { immediate: true, deep: true })

// 更新用户输入
const updateUserInputs = () => {
  emit('update:userInputs', localUserInputs.value)
}

// 移除字符串中的<def>标签及其内容
const removeDefTags = (str: string) => {
  return str.replace(/<def>.*?<\/def>/g, '')
}

// 获取对应的adminInput值
const getAdminInputValue = (userKey: string) => {
  // 从inputA1转换为inputB1
  const adminKey = userKey.replace('inputA', 'inputB')
  const value = props.adminInputs[adminKey] || ''
  // 移除<def>标签及其内容
  return removeDefTags(value)
}
</script>

<style scoped>
.input-panel {
  padding: 0 16px;
}

.input-group {
  margin-bottom: 15px;
}

.input-with-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-label {
  min-width: 100px;
  text-align: right;
  color: #1a1a1a;
  font-weight: 500;
}
</style>
