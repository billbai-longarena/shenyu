<template>
  <div class="resizable-layout" @mousemove="handleDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
    <!-- 左侧面板 -->
    <div class="left-panel" :style="{ width: leftWidth + 'px' }">
      <slot name="left"></slot>
    </div>

    <!-- 分隔线 -->
    <div 
      class="resizer" 
      @mousedown="startDrag"
      :class="{ 'resizing': isDragging }"
    ></div>

    <!-- 右侧面板 -->
    <div class="right-panel" :style="{ width: `calc(100% - ${leftWidth}px - 6px)` }">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  initialLeftWidth?: number
  minWidth?: number
}>(), {
  initialLeftWidth: 400,
  minWidth: 200
})

// 拖动相关的状态
const isDragging = ref(false)
const leftWidth = ref(props.initialLeftWidth)

// 拖动处理函数
const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  const container = document.querySelector('.resizable-layout')
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const newWidth = e.clientX - containerRect.left

  // 限制最小宽度
  if (newWidth >= props.minWidth && newWidth <= containerRect.width - props.minWidth) {
    leftWidth.value = newWidth
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}
</script>

<style scoped>
.resizable-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
}

.left-panel {
  overflow-y: auto;
  box-sizing: border-box;
  min-width: v-bind('props.minWidth + "px"');
}

.right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  min-width: v-bind('props.minWidth + "px"');
}

/* 分隔线样式 */
.resizer {
  width: 6px;
  cursor: col-resize;
  background-color: #f0f0f0;
  position: relative;
  transition: background-color 0.2s;
}

.resizer:hover,
.resizer.resizing {
  background-color: #409eff;
}

.resizer::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 20px;
  background-color: #909399;
  border-radius: 1px;
}
</style>
