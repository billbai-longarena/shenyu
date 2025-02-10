# 组件文档

## HistoryPanel 组件

### 功能描述
历史记录面板组件，用于管理和显示对话历史记录。支持创建新对话、选择历史记录、编辑历史记录等功能。

### 组件接口

#### Props
- storage-key: string
  - 必填
  - 用于本地存储的键名
  - 不同功能模块使用不同的键名，实现独立的历史记录管理

#### Events
- select(history: ChatHistory)
  - 当用户选择一条历史记录时触发
  - 参数为选中的历史记录对象

- new-chat()
  - 当用户点击开启新对话时触发
  - 无参数

#### Methods
- updateOrCreateHistory(messages: Message[])
  - 更新或创建历史记录
  - 如果当前正在编辑历史记录，则更新该记录
  - 如果是新对话，则创建新记录

### 数据结构

```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatHistory {
  id: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}
```

### 复用策略

1. 存储管理
   - 使用useHistory组合式函数
   - 支持按模块分离存储
   - 自动处理本地存储逻辑

2. UI组件
   - 使用Element Plus组件库
   - 支持自定义样式和主题

3. 历史记录管理
   - 统一的历史记录格式
   - 支持创建、更新、删除操作
   - 自动维护时间戳

### 使用示例

```vue
<template>
  <HistoryPanel
    storage-key="module-history"
    @select="handleSelect"
    @new-chat="handleNewChat"
    ref="historyPanel"
  />
</template>

<script setup lang="ts">
import type { ChatHistory } from '../types/chat'

const historyPanel = ref()

// 处理选择历史记录
const handleSelect = (history: ChatHistory) => {
  // 处理选中的历史记录
}

// 处理开启新对话
const handleNewChat = () => {
  // 处理开启新对话
}

// 更新或创建历史记录
const updateHistory = (messages: Message[]) => {
  historyPanel.value?.updateOrCreateHistory(messages)
}
</script>
```

### 布局规范

1. 容器布局
   - 组件容器应使用flex布局
   - 所有容器必须设置box-sizing: border-box
   - 避免使用固定高度，优先使用flex: 1自适应
   - 内容区域高度需考虑顶部导航栏(60px)

2. 滚动处理
   - 使用overflow-y: auto控制垂直滚动
   - 为滚动容器设置合适的padding
   - 必要时自定义滚动条样式
   - 长文本使用overflow-wrap: break-word

3. 响应式设计
   - 避免使用固定宽度
   - 使用百分比或flex布局
   - 设置合适的min-width/max-width
   - 考虑移动端适配

### 注意事项

1. 历史记录管理
   - 确保提供正确的storage-key
   - 不同模块使用不同的storage-key
   - 历史记录按时间倒序排列

2. 组件引用
   - 使用ref获取组件实例
   - 调用updateOrCreateHistory方法时需要通过ref

3. 性能优化
   - 历史记录懒加载
   - 本地存储定期清理
   - 避免存储过大的内容

4. 数据格式
   - 确保messages数组格式正确
   - 必须包含role和content字段
   - content支持HTML内容

5. 样式隔离
   - 使用scoped样式
   - 深度选择器使用:deep()
   - 避免全局样式污染
   - 遵循BEM命名规范
