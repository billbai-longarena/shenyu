<template>
  <div class="input-panel">
    <div v-for="(value, key) in localUserInputs" :key="String(key)" class="input-group">
      <div class="input-with-label">
        <span class="input-label">{{ getAdminInputValue(String(key)) }}</span>
        <!-- 根据key的类型显示不同的输入控件 -->
        <template v-if="String(key).startsWith('inputpdfA')">
          <div class="pdf-controls">
            <div class="pdf-options">
              <el-upload
                class="pdf-uploader"
                :auto-upload="false"
                :show-file-list="true"
                :on-change="(file) => handlePdfChange(file, String(key))"
                :limit="1"
                :on-exceed="handleExceed"
                accept=".pdf"
                :disabled="isPdfParsing"
              >
                <el-button type="primary" :disabled="isPdfParsing">
                  {{ getAdminInputValue(String(key)) || '选择PDF文件' }}
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">只能上传1个pdf文件，新上传会覆盖旧的</div>
                </template>
              </el-upload>
              <el-checkbox v-model="useLocalOcr" :disabled="isPdfParsing">使用本地OCR</el-checkbox>
            </div>
          </div>
        </template>
        <template v-else>
          <el-input 
            v-model="localUserInputs[key]"
            type="textarea"
            :rows="1"
            :placeholder="t('inputPanel.inputPlaceholder') + key"
            @input="updateUserInputs"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLanguage } from '../../../composables/useLanguage'
import { ElMessage } from 'element-plus'
import { parsePdfContent } from '../../../utils/pdfParser'

const { t } = useLanguage()

const props = defineProps<{
  userInputs: { [key: string]: string }
  adminInputs: { [key: string]: string }
}>()

const emit = defineEmits<{
  (e: 'update:userInputs', value: { [key: string]: string }): void
  (e: 'pdfParsingStatus', value: boolean): void
}>()

const isPdfParsing = ref(false)
const useLocalOcr = ref(true)

// 处理超出文件数量限制
const handleExceed = () => {
  ElMessage.warning('只能上传1个PDF文件，新上传会覆盖旧的')
}

// 处理PDF文件变化
const handlePdfChange = async (file: any, key: string) => {
  if (file && file.raw) {
    isPdfParsing.value = true
    emit('pdfParsingStatus', true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string
        try {
          // 解析PDF并存储解析结果
          const pdfText = await parsePdfContent(base64Content, useLocalOcr.value)
          localUserInputs.value[key] = pdfText
          updateUserInputs()
          ElMessage.success('PDF解析成功')
        } catch (error) {
          console.error('PDF解析错误:', error)
          ElMessage.error('PDF解析失败')
        } finally {
          isPdfParsing.value = false
          emit('pdfParsingStatus', false)
        }
      }
      reader.readAsDataURL(file.raw)
    } catch (error) {
      console.error('文件读取错误:', error)
      ElMessage.error('文件读取失败')
      isPdfParsing.value = false
      emit('pdfParsingStatus', false)
    }
  }
}

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
  // 根据不同类型的输入框处理
  const adminKey = userKey.startsWith('inputpdfA') 
    ? userKey.replace('inputpdfA', 'inputpdfB')
    : userKey.replace('inputA', 'inputB')
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
  align-items: flex-start;
  gap: 10px;
}

.input-label {
  min-width: 100px;
  text-align: right;
  color: #1a1a1a;
  font-weight: 500;
  padding-top: 8px;
}

.pdf-controls {
  display: flex;
  gap: 10px;
  width: 100%;
}

.pdf-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.pdf-uploader {
  flex: 1;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
</style>
