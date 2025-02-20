<!-- 配置管理区域组件 -->
<template>
  <div class="config-section" :style="{ width: width + '%' }">
    <div class="config-section-content">
      <div class="config-inputs-container">
        <h2 class="admin-title">{{ t('configPanel.userInputConfig') }}</h2>
        
        <!-- 配置操作按钮 -->
        <div class="config-actions">
          <el-input
            v-model="versionDescription"
            :placeholder="t('configPanel.versionManagement.inputPlaceholder')"
            class="version-input"
          />
          <el-button 
            type="danger"
            @click="handleExportConfig"
          >
            {{ t('configPanel.saveExport') }}
          </el-button>
          <el-button 
            type="primary"
            @click="fileInput?.click()"
          >
            {{ t('configPanel.importJson') }}
          </el-button>
        </div>
        
        <!-- 隐藏的文件输入框 -->
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept=".json"
          @change="handleFileUpload"
        />

        <!-- 动态生成的配置输入框 -->
        <div v-for="(value, key) in adminInputs" :key="key" class="input-group">
          <div class="input-with-label">
            <el-button 
              type="primary" 
              link
              class="insert-button"
              @click="handleAdminInputInsert(String(key))"
              :disabled="lastFocusedIndex === null"
            >
              {{ t('configPanel.insert') }}
            </el-button>
            <el-input 
              v-model="adminInputs[key]"
              :placeholder="t('configPanel.inputPlaceholder') + key"
              @input="(value: string) => handleAdminInput(String(key), value)"
            />
            <el-button
              type="danger"
              link
              @click="deleteAdminInput(String(key))"
            >
              {{ t('configPanel.delete') }}
            </el-button>
          </div>
        </div>

        <!-- 增加用户输入按钮 -->
        <div class="button-group">
          <el-button 
            type="primary" 
            class="add-input-button"
            @click="addUserInput"
          >
            {{ t('configPanel.addUserInput') }}
          </el-button>
        </div>

        <!-- 版本历史列表 -->
        <div class="version-history" v-if="versionHistory.length">
          <h3>{{ t('configPanel.versionManagement.historyTitle') }}</h3>
          <el-card v-for="(version, index) in versionHistory" 
                   :key="version.version"
                   :class="{ 'current-version': currentVersionIndex === index }"
                   class="version-card">
            <div class="version-item">
              <div class="version-info">
                <span class="version-time">{{ formatTimestamp(version.timestamp) }}</span>
                <span class="version-desc">{{ version.description }}</span>
              </div>
              <el-button 
                type="primary" 
                size="small" 
                style="padding: 4px 8px; height: 24px"
                @click="loadVersion(index)"
              >
                {{ t('configPanel.versionManagement.loadVersion') }}
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section">
          <h3 class="preview-title">{{ t('configPanel.previewTitle') }}</h3>
          <div class="preview-content" ref="previewContent">
            <div class="messages">
              <div class="message">
                <div class="assistant-message">
                  <div class="loading-icon" v-if="isPreviewLoading">
                    <svg viewBox="0 0 1024 1024" class="loading">
                      <path d="M512 64q14.016 0 23.008 8.992T544 96v192q0 14.016-8.992 23.008T512 320t-23.008-8.992T480 288V96q0-14.016 8.992-23.008T512 64zm0 640q14.016 0 23.008 8.992T544 736v192q0 14.016-8.992 23.008T512 960t-23.008-8.992T480 928V736q0-14.016 8.992-23.008T512 704zm448-192q0 14.016-8.992 23.008T928 544H736q-14.016 0-23.008-8.992T704 512t8.992-23.008T736 480h192q14.016 0 23.008 8.992T960 512zm-640 0q0 14.016-8.992 23.008T288 544H96q-14.016 0-23.008-8.992T64 512t8.992-23.008T96 480h192q14.016 0 23.008 8.992T320 512zM195.008 195.008q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zm454.016 454.016q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zM828.992 195.008q8.992 10.016 8.992 23.008t-8.992 22.016l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992zM375.008 649.024q8.992 10.016 8.992 22.016t-8.992 23.008l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992z"/>
                    </svg>
                  </div>
                  <div class="markdown-content" v-html="renderedPreviewText"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { marked } from 'marked'
import { useConfigActions } from '../../composables/useConfigActions'
import { useLanguage } from '../../composables/useLanguage'
import { useVersionConfig } from '../../composables/useVersionConfig'

interface Props {
  width: number
  adminInputs: { [key: string]: string }
  userInputs: { [key: string]: string }
  promptBlocks: any[]
  inputCounter: number
  lastFocusedIndex: number | null
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
})
</script>

<style scoped>
.config-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--el-border-color);
  padding: 20px;
  box-sizing: border-box;
}

.config-section-content {
  height: 100%;
  overflow-y: auto;
}

.admin-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.config-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.version-input {
  flex: 1;
}

.input-group {
  margin-bottom: 15px;
}

.input-with-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.button-group {
  margin-top: 20px;
}

.add-input-button {
  width: 100%;
}

.version-history {
  margin-top: 20px;
}

.version-history h3 {
  margin-bottom: 8px;
  font-size: 14px;
}

.version-card {
  margin-bottom: 4px;
}

.version-card :deep(.el-card__body) {
  padding: 2px 8px;
}

.version-card.current-version {
  border: 1px solid var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  line-height: 1;
}

.version-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.version-desc {
  font-size: 12px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
