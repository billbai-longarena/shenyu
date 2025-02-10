# SN43View 组件

## 组件概述

SN43View 是一个提示词生成组件，支持历史记录管理和配置导入导出功能。该组件系统由多个子组件组成，实现了完整的提示词管理和执行功能。

## 组件架构

### 1. SN43View.vue（主组件）
- 整体布局和状态管理
- 协调子组件通信
- 处理历史记录的保存和恢复

### 2. UserInterface.vue（用户界面组件）
- 处理用户输入和配置项
- 管理多块提示词的执行
- 支持Markdown格式的结果显示
- 提供结果复制功能

### 3. ConfigPanel.vue（配置面板组件）
- 管理提示词模板配置：支持多块提示词的创建和编辑，每个提示词块可以包含变量和嵌套引用
- 处理配置的导入导出：通过JSON格式实现配置的备份和迁移
- 提供配置重置功能：一键恢复到默认配置状态
- 提供提示词预览功能：在执行前实时验证提示词效果，通过变量替换和递归解析实现提示词块的组合

## 功能特性

1. **提示词管理**
   提示词系统采用模块化设计，支持提示词的分块管理和组合。每个提示词块都是独立的单元，可以包含变量引用和其他提示词块的嵌套。系统通过以下机制实现灵活的提示词生成：

   - **变量系统**：使用${inputBX}语法引用用户输入，在预览和执行时自动替换为实际值
   - **提示词组合**：通过${promptBlockX}语法实现提示词块的嵌套引用，支持多层级的组合
   - **预览机制**：采用递归解析算法，先处理最内层的变量和引用，再逐层向外处理，最终生成完整的提示词内容
   - **执行流程**：支持多个提示词块的批量执行，每个块独立处理并返回结果
   - **流式响应**：实现类似ChatView的实时显示效果，让用户能看到内容逐步生成的过程
   
   系统提供两种不同的处理机制来满足不同场景的需求：

   - **流式响应处理机制**：
     - 使用增量更新策略，实时显示AI返回的内容
     - 通过缓存机制支持实时渲染和更新
     - 保持滚动位置的流畅性
     - 适用于需要实时反馈的交互场景

   - **执行按钮处理机制**：
     - 使用缓存优化，避免重复处理相同的块
     - 按照块的索引顺序依次处理
     - 不使用递归，而是通过缓存机制处理块之间的引用
     - 适用于完整执行所有提示词块的场景
   
   - **预览按钮处理机制**：
     - 使用递归处理，实时解析每个引用的块
     - 不使用缓存，每次都重新处理
     - 按照引用关系的顺序处理
     - 适用于调试和验证单个提示词块的场景

2. **历史记录**
   历史记录系统通过本地存储实现执行记录的持久化，每次执行都会自动保存配置和结果。系统采用时间戳作为唯一标识，记录包含完整的执行上下文：

   - **存储机制**：使用浏览器的localStorage实现持久化，支持配置自定义存储键名
   - **记录结构**：包含执行时间、配置快照和执行结果，便于后续复现
   - **状态恢复**：点击历史记录可一键恢复当时的配置状态，实现场景复现

3. **配置管理**
   配置系统采用JSON格式实现数据的序列化和持久化，支持完整的配置生命周期管理：

   - **数据结构**：使用TypeScript接口定义配置格式，确保类型安全
   - **导入导出**：支持配置的序列化和反序列化，实现跨设备迁移
   - **版本控制**：通过默认配置机制实现配置的重置和回滚

## 使用示例

### 基础用法

::: code-group

```vue [基本配置]
<template>
  <SN43View
    :default-config="defaultConfig"
    @execute="handleExecute"
  />
</template>

<script setup lang="ts">
import SN43View from '@/views/sn43/SN43View.vue'

const defaultConfig = {
  adminInputs: {
    inputB1: "客户公司",
    inputB2: "客户行业"
  },
  promptBlocks: [
    "按照参考信息写一个案例 ${inputB1} ${inputB2}"
  ]
}

const handleExecute = (results: string[]) => {
  console.log('执行结果:', results)
}
</script>
```

```vue [完整功能]
<template>
  <div class="sn43-container">
    <SN43View
      ref="sn43ViewRef"
      :default-config="defaultConfig"
      @execute="handleExecute"
      @config-change="handleConfigChange"
      @history-select="handleHistorySelect"
    >
      <template #header>
        <div class="custom-header">
          <h2>提示词生成器</h2>
          <div class="header-actions">
            <button @click="exportConfig">导出配置</button>
            <button @click="importConfig">导入配置</button>
          </div>
        </div>
      </template>
    </SN43View>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SN43View from '@/views/sn43/SN43View.vue'
import { useConfig } from '@/composables/useConfig'

const sn43ViewRef = ref()
const { loadConfig, saveConfig } = useConfig()

const defaultConfig = {
  adminInputs: {
    inputB1: "客户公司",
    inputB2: "客户行业"
  },
  promptBlocks: [
    "按照参考信息写一个案例 ${inputB1} ${inputB2}"
  ]
}

// 处理执行结果
const handleExecute = (results: string[]) => {
  console.log('执行结果:', results)
}

// 处理配置变更
const handleConfigChange = (config: any) => {
  saveConfig(config)
}

// 处理历史记录选择
const handleHistorySelect = (history: any) => {
  console.log('选择历史记录:', history)
}

// 导出配置
const exportConfig = () => {
  const config = sn43ViewRef.value?.getCurrentConfig()
  if (config) {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sn43-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 导入配置
const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const text = await file.text()
      try {
        const config = JSON.parse(text)
        sn43ViewRef.value?.setConfig(config)
      } catch (error) {
        console.error('配置文件格式错误:', error)
      }
    }
  }
  input.click()
}
</script>

<style scoped>
.sn43-container {
  height: 100%;
  padding: 20px;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
}

.header-actions button:hover {
  background-color: #f5f5f5;
}
</style>
```

:::

## 配置说明

### 配置文件格式

```typescript
interface SN43Config {
  // 管理员输入项配置
  adminInputs: {
    [key: string]: string;
  };
  // 提示词模板列表
  promptBlocks: string[];
}
```

### 默认配置示例

```json
{
  "adminInputs": {
    "inputB1": "客户公司",
    "inputB2": "客户行业"
  },
  "promptBlocks": [
    "按照参考信息写一个案例 ${inputB1} ${inputB2}"
  ]
}
```

## 组件接口

### Props

```typescript
interface Props {
  // 默认配置
  defaultConfig?: SN43Config;
  // 是否显示历史记录
  showHistory?: boolean;
  // 存储键名
  storageKey?: string;
}
```

### Events

```typescript
interface Events {
  // 执行完成时触发
  'execute': (results: string[]) => void;
  // 配置变更时触发
  'config-change': (config: SN43Config) => void;
  // 选择历史记录时触发
  'history-select': (history: any) => void;
}
```

### 方法

```typescript
interface Methods {
  // 获取当前配置
  getCurrentConfig(): SN43Config;
  // 设置配置
  setConfig(config: SN43Config): void;
  // 重置配置
  resetConfig(): void;
  // 执行提示词
  execute(): Promise<void>;
}
```

## 最佳实践

1. **配置管理**
   ```typescript
   // 使用组合式函数管理配置
   function useSN43Config() {
     const config = ref<SN43Config>({
       adminInputs: {},
       promptBlocks: []
     })
   
     // 加载配置
     const loadConfig = async () => {
       try {
         const response = await fetch('/sn4+3.json')
         const defaultConfig = await response.json()
         config.value = defaultConfig
       } catch (error) {
         console.error('加载配置失败:', error)
       }
     }
   
     // 保存配置
     const saveConfig = async (newConfig: SN43Config) => {
       config.value = newConfig
       // 可以添加持久化存储逻辑
     }
   
     return {
       config,
       loadConfig,
       saveConfig
     }
   }
   ```

2. **历史记录管理**
   ```typescript
   // 使用组合式函数管理历史记录
   function useSN43History(storageKey: string) {
     const { createHistory, loadHistory } = useHistory(storageKey)
   
     // 保存执行记录
     const saveExecution = async (config: SN43Config, results: string[]) => {
       await createHistory({
         title: new Date().toLocaleString(),
         config,
         results
       })
     }
   
     // 恢复历史记录
     const restoreHistory = async (id: string) => {
       const history = await loadHistory(id)
       if (history?.config) {
         return history.config
       }
     }
   
     return {
       saveExecution,
       restoreHistory
     }
   }
   ```

3. **错误处理**
   ```typescript
   // 统一的错误处理
   function handleSN43Error(error: any) {
     if (error.type === 'config') {
       // 处理配置错误
       console.error('配置错误:', error.message)
     } else if (error.type === 'execution') {
       // 处理执行错误
       console.error('执行错误:', error.message)
     } else {
       // 处理其他错误
       console.error('未知错误:', error)
     }
   }
   ```

## 注意事项

1. **性能优化**
   - 避免频繁的配置保存
   - 使用防抖处理用户输入
   - 优化大量历史记录的展示

2. **错误处理**
   - 验证配置文件格式
   - 处理执行过程中的错误
   - 提供用户友好的错误提示

3. **用户体验**
   - 提供加载状态指示
   - 支持快捷键操作
   - 优化响应式布局

4. **数据安全**
   - 验证导入的配置文件
   - 保护敏感配置信息
   - 实现配置备份机制
