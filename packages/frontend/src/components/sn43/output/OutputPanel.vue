<template>
  <div class="output-panel">
    <div class="output-header">
      <h2 class="output-title">输出结果</h2>
      <el-button
        v-if="renderedBlocks.length > 0"
        type="primary"
        link
        :icon="CopyDocumentIcon"
        @click="copyOutputResult"
      >
        复制结果
      </el-button>
    </div>
    <div class="output-content" ref="outputContent">
      <div class="messages">
        <div v-for="(block, index) in renderedBlocks" :key="index" class="result-block">
          <div class="loading-icon" v-if="blockStatuses[index]?.status === 'streaming'">
            <svg viewBox="0 0 1024 1024" class="loading">
              <path d="M512 64q14.016 0 23.008 8.992T544 96v192q0 14.016-8.992 23.008T512 320t-23.008-8.992T480 288V96q0-14.016 8.992-23.008T512 64zm0 640q14.016 0 23.008 8.992T544 736v192q0 14.016-8.992 23.008T512 960t-23.008-8.992T480 928V736q0-14.016 8.992-23.008T512 704zm448-192q0 14.016-8.992 23.008T928 544H736q-14.016 0-23.008-8.992T704 512t8.992-23.008T736 480h192q14.016 0 23.008 8.992T960 512zm-640 0q0 14.016-8.992 23.008T288 544H96q-14.016 0-23.008-8.992T64 512t8.992-23.008T96 480h192q14.016 0 23.008 8.992T320 512zM195.008 195.008q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zm454.016 454.016q10.016-8.992 23.008-8.992t22.016 8.992l136 136q8.992 10.016 8.992 23.008t-8.992 22.016-23.008 8.992-22.016-8.992l-136-136q-8.992-8.992-8.992-22.016t8.992-23.008zM828.992 195.008q8.992 10.016 8.992 23.008t-8.992 22.016l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992zM375.008 649.024q8.992 10.016 8.992 22.016t-8.992 23.008l-136 136q-10.016 8.992-22.016 8.992t-23.008-8.992-8.992-22.016 8.992-23.008l136-136q8.992-8.992 22.016-8.992t23.008 8.992z"/>
            </svg>
          </div>
          <div v-html="block"></div>
          <hr v-if="index < renderedBlocks.length - 1" class="block-divider">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Document as CopyDocumentIcon } from '@element-plus/icons-vue'
import { marked } from 'marked'

interface BlockStatus {
  status: 'pending' | 'streaming' | 'completed' | 'error'
  error?: string
}

const props = defineProps<{
  blockContents: string[]
  blockStatuses: BlockStatus[]
}>()

// 计算属性：渲染后的块内容
const renderedBlocks = computed(() => {
  return props.blockContents.map(content => marked(content).toString())
})

// 复制结果到剪贴板
const copyOutputResult = async () => {
  try {
    // 创建一个临时div来解析HTML内容
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = props.blockContents.join('\n')
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    
    // 尝试使用 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textContent)
    } else {
      // 后备方案：创建临时textarea元素
      const textarea = document.createElement('textarea')
      textarea.value = textContent
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      
      try {
        // 执行复制命令
        document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (err) {
        document.body.removeChild(textarea)
        throw new Error('复制失败')
      }
    }
    
    ElMessage.success('复制成功')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 自动滚动到当前更新的block
watch(() => props.blockContents, () => {
  nextTick(() => {
    const outputContent = document.querySelector('.output-content')
    const blocks = document.querySelectorAll('.result-block')
    const lastBlock = blocks[blocks.length - 1]
    
    if (outputContent && lastBlock) {
      const blockRect = lastBlock.getBoundingClientRect()
      const containerRect = outputContent.getBoundingClientRect()
      
      // 检查block底部是否在可视区域内
      const isBottomVisible = blockRect.bottom <= containerRect.bottom
      
      if (!isBottomVisible) {
        // 滚动到最新的block
        outputContent.scrollTo({
          top: outputContent.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  })
}, { deep: true })
</script>

<style scoped>
.output-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
  height: 32px;
}

.output-title {
  color: #1a1a1a;
  font-weight: 600;
  margin: 0;
  line-height: 32px;
}

.output-content {
  flex: 1;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow-y: auto;
  color: #333333;
  font-size: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  padding: 0;
  margin-top: 0;
}

.output-content .messages {
  padding: 16px;
  overflow-wrap: break-word;
  box-sizing: border-box;
  min-height: 100%;
}

.loading-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  display: inline-block;
}

.loading {
  animation: rotate 1s linear infinite;
  fill: #409eff;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.result-block {
  position: relative;
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.block-divider {
  margin: 24px 0;
  border: none;
  height: 20px;
}

/* 确保滚动条始终显示 */
.output-content::-webkit-scrollbar {
  width: 8px;
  background-color: #f5f5f5;
}

.output-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 4px;
}

.output-content::-webkit-scrollbar-track {
  background-color: #f5f5f5;
  border-radius: 4px;
}

/* Markdown样式 */
.result-block :deep(pre) {
  background-color: #f8f9fa;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.result-block :deep(code) {
  background-color: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.result-block :deep(p) {
  margin: 1em 0;
}

.result-block :deep(ul),
.result-block :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.result-block :deep(h1),
.result-block :deep(h2),
.result-block :deep(h3),
.result-block :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 1em;
  font-weight: 600;
}

.result-block :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid #dcdfe6;
  color: #666;
}

.result-block :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

.result-block :deep(th),
.result-block :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 0.6em 1em;
}

.result-block :deep(th) {
  background-color: #f8f9fa;
}
</style>
