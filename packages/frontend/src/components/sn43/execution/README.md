# ExecutionPanel 组件文档

## 组件概述

ExecutionPanel是SN43View的执行控制组件，负责处理执行按钮的状态管理和执行过程的可视化展示。

## 组件接口

### Props
```typescript
interface Props {
  isEditing: boolean              // 是否处于编辑模式
  isParallelMode: boolean         // 是否为并行处理模式
  blockStatuses: BlockStatus[]    // 所有block的状态
  isAllBlocksCompleted: boolean   // 是否所有block都已完成
  hasUserInputs: boolean          // 是否有用户输入
}

interface BlockStatus {
  status: 'pending' | 'streaming' | 'completed' | 'error'
  error?: string
}
```

### Events
```typescript
interface Events {
  execute: () => void  // 触发执行操作
}
```

## 功能特性

### 1. 执行按钮状态管理
- 动态计算按钮文本
  * 编辑模式显示"重写"
  * 无输入时显示"请先载入模板"
  * 默认显示"执行"

- 智能禁用控制
  * 无用户输入时禁用
  * 任何block处于处理中状态时禁用
  * 已有任务执行中时禁用

### 2. 并行模式状态展示
- 显示每个block的处理状态
- 使用不同颜色标识不同状态
- 支持错误信息展示
- 完成时的淡出动画效果

### 3. 状态可视化
- 使用Element Plus的Tag组件展示状态
- 不同状态对应不同的视觉样式：
  * pending: info类型
  * streaming: warning类型
  * completed: success类型
  * error: danger类型

## 样式设计

### 1. 布局结构
```css
.execution-panel {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}
```

### 2. 状态展示
```css
.parallel-mode-status {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
  border: 1px solid #e4e7ed;
}
```

### 3. 动画效果
```css
.parallel-mode-status {
  transition: all 0.5s ease-out;
  opacity: 1;
  transform: translateY(0);
}

.parallel-mode-status.fade-out {
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
}
```

## 最近更新

### 2024-02-04 执行状态管理优化

1. 按钮状态控制改进
   - 添加了执行中状态检查
   - 优化了禁用逻辑
   - 改进了状态展示

2. 并行处理支持
   - 支持多block状态展示
   - 优化了状态更新机制
   - 添加了完成动画效果

3. 错误处理增强
   - 清晰的错误状态展示
   - 详细的错误信息显示
   - 优化的错误恢复流程

## 使用示例

```vue
<template>
  <ExecutionPanel
    :is-editing="isEditing"
    :is-parallel-mode="isParallelMode"
    :block-statuses="blockStatuses"
    :is-all-blocks-completed="isAllBlocksCompleted"
    :has-user-inputs="hasUserInputs"
    @execute="handleExecute"
  />
</template>

<script setup lang="ts">
const handleExecute = () => {
  // 执行处理逻辑
}
</script>
```

## 注意事项

1. 状态管理
   - 确保blockStatuses数组与实际block数量匹配
   - 正确处理状态更新的时机
   - 注意并行模式下的状态同步

2. 性能考虑
   - 避免不必要的状态更新
   - 合理使用计算属性
   - 优化动画性能

3. 错误处理
   - 提供清晰的错误反馈
   - 确保错误状态正确重置
   - 保持用户界面的响应性

## 最佳实践

1. 状态更新
   - 使用计算属性处理复杂的状态逻辑
   - 避免直接修改props
   - 通过事件通知状态变化

2. 用户体验
   - 提供清晰的视觉反馈
   - 确保按钮状态直观
   - 优化动画效果

3. 代码组织
   - 保持组件职责单一
   - 使用TypeScript类型
   - 遵循Vue 3最佳实践
