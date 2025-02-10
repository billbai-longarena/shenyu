# HistoryPanel 组件

## 组件概述

HistoryPanel 是一个通用的历史记录管理面板组件，支持多模块独立存储和完整的历史记录管理功能。

## 组件特性

- 多模块存储隔离
- 统一的历史记录数据结构
- 完整的CRUD操作支持
- 自动存储管理

## 组件接口

### Props

```typescript
interface Props {
  // 存储键名，用于区分不同模块的历史记录
  storageKey: string;
  // 当前选中的历史记录ID
  selectedId?: string;
  // 是否显示新建按钮
  showCreateButton?: boolean;
  // 自定义类名
  className?: string;
}
```

### Events

```typescript
interface Events {
  // 选择历史记录时触发
  'update:selectedId': (id: string) => void;
  // 创建新记录时触发
  'create': () => void;
  // 编辑记录时触发
  'edit': (id: string, title: string) => void;
  // 删除记录时触发
  'delete': (id: string) => void;
}
```

### 插槽

```vue
<!-- 自定义历史记录项内容 -->
<slot name="item" v-bind="{ item, isSelected }">
  <div class="history-item-title">{{ item.title }}</div>
</slot>

<!-- 自定义空状态展示 -->
<slot name="empty">
  <div class="history-empty">暂无历史记录</div>
</slot>
```

## 使用示例

### 基础用法

::: code-group

```vue [基础示例]
<template>
  <HistoryPanel
    storage-key="chat-history"
    v-model:selectedId="currentId"
    @create="handleCreate"
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HistoryPanel from '@/components/HistoryPanel.vue'

const currentId = ref<string>('')

const handleCreate = () => {
  // 处理创建新记录
}

const handleEdit = (id: string, title: string) => {
  // 处理编辑记录
}

const handleDelete = (id: string) => {
  // 处理删除记录
}
</script>
```

```vue [自定义项目展示]
<template>
  <HistoryPanel
    storage-key="chat-history"
    v-model:selectedId="currentId"
  >
    <template #item="{ item, isSelected }">
      <div class="custom-item" :class="{ 'is-selected': isSelected }">
        <div class="item-title">{{ item.title }}</div>
        <div class="item-date">{{ formatDate(item.timestamp) }}</div>
      </div>
    </template>
  </HistoryPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import { formatDate } from '@/utils/date'

const currentId = ref<string>('')
</script>

<style scoped>
.custom-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.custom-item.is-selected {
  background-color: #e6f7ff;
}

.item-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.item-date {
  font-size: 12px;
  color: #999;
}
</style>
```

```vue [完整功能示例]
<template>
  <div class="chat-container">
    <HistoryPanel
      class="history-panel"
      storage-key="chat-history"
      v-model:selectedId="currentId"
      @create="createNewChat"
      @edit="editChatTitle"
      @delete="deleteChat"
    >
      <template #item="{ item, isSelected }">
        <div class="chat-item" :class="{ 'is-selected': isSelected }">
          <div class="chat-title">{{ item.title }}</div>
          <div class="chat-info">
            <span class="chat-date">{{ formatDate(item.timestamp) }}</span>
            <span class="chat-count">{{ item.messages?.length || 0 }}条消息</span>
          </div>
        </div>
      </template>
      
      <template #empty>
        <div class="empty-state">
          <i class="icon-message" />
          <p>开始新的对话</p>
          <button @click="createNewChat">创建对话</button>
        </div>
      </template>
    </HistoryPanel>
    
    <div class="chat-content">
      <!-- 聊天内容区域 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import { useHistory } from '@/composables/useHistory'
import { formatDate } from '@/utils/date'

const currentId = ref<string>('')
const { createHistory, updateHistory, deleteHistory } = useHistory('chat-history')

// 创建新对话
const createNewChat = async () => {
  const id = await createHistory({
    title: '新对话',
    messages: []
  })
  currentId.value = id
}

// 编辑对话标题
const editChatTitle = async (id: string, title: string) => {
  await updateHistory(id, { title })
}

// 删除对话
const deleteChat = async (id: string) => {
  await deleteHistory(id)
  if (currentId.value === id) {
    currentId.value = ''
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
}

.history-panel {
  width: 260px;
  border-right: 1px solid #eee;
}

.chat-content {
  flex: 1;
  overflow: hidden;
}

.chat-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.chat-item:hover {
  background-color: #f5f5f5;
}

.chat-item.is-selected {
  background-color: #e6f7ff;
}

.chat-title {
  font-weight: bold;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state .icon-message {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state button {
  margin-top: 16px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
  border: none;
  cursor: pointer;
}

.empty-state button:hover {
  background-color: #40a9ff;
}
</style>
```

:::

## 最佳实践

1. **存储键管理**
   ```typescript
   // 推荐使用常量管理storage-key
   const STORAGE_KEYS = {
     CHAT: 'chat-history',
     PROMPT: 'prompt-history',
     EXECUTION: 'execution-history'
   } as const
   
   // 使用时
   <HistoryPanel :storage-key="STORAGE_KEYS.CHAT" />
   ```

2. **组合式函数集成**
   ```typescript
   // 创建统一的历史记录管理hook
   function useHistoryManager(storageKey: string) {
     const currentId = ref('')
     const { createHistory, updateHistory, deleteHistory } = useHistory(storageKey)
   
     const handleCreate = async () => {
       const id = await createHistory({
         title: '新记录',
         timestamp: Date.now()
       })
       currentId.value = id
     }
   
     const handleEdit = async (id: string, title: string) => {
       await updateHistory(id, { title })
     }
   
     const handleDelete = async (id: string) => {
       await deleteHistory(id)
       if (currentId.value === id) {
         currentId.value = ''
       }
     }
   
     return {
       currentId,
       handleCreate,
       handleEdit,
       handleDelete
     }
   }
   ```

3. **样式定制**
   ```vue
   <template>
     <HistoryPanel
       :class="[
         'custom-history-panel',
         { 'is-compact': isCompact }
       ]"
       :storage-key="storageKey"
     />
   </template>
   
   <style>
   .custom-history-panel {
     /* 自定义基础样式 */
   }
   
   .custom-history-panel.is-compact {
     /* 紧凑模式样式 */
   }
   
   /* 修改滚动条样式 */
   .custom-history-panel ::-webkit-scrollbar {
     width: 6px;
   }
   
   .custom-history-panel ::-webkit-scrollbar-thumb {
     background-color: #ccc;
     border-radius: 3px;
   }
   </style>
   ```

## 注意事项

1. **存储管理**
   - 为不同模块使用唯一的storage-key
   - 注意浏览器存储限制
   - 实现定期清理机制

2. **性能优化**
   - 使用虚拟滚动处理大量记录
   - 避免频繁的存储操作
   - 优化渲染性能

3. **用户体验**
   - 提供加载状态指示
   - 添加操作确认提示
   - 支持键盘导航

4. **数据同步**
   - 处理多标签页同步
   - 实现数据备份恢复
   - 考虑离线支持
