# SN43 组件文档

## 组件概述

SN43模块的组件采用了模块化设计，将复杂的用户界面拆分为多个专注的子组件。每个组件都有明确的职责和接口定义。

## 组件列表

### 1. ResizableLayout.vue

#### 功能描述
提供可调整宽度的两栏布局，支持通过拖动分隔线调整左右面板的宽度。

#### Props
- initialLeftWidth: number (默认: 400)
  - 左侧面板的初始宽度
- minWidth: number (默认: 200)
  - 面板的最小宽度限制

#### 插槽
- left: 左侧面板内容
- right: 右侧面板内容

### 2. ConfigSelector.vue

#### 功能描述
处理配置文件的选择和加载，管理JSON配置文件的选择和导入。

#### Props
- modelValue: string
  - 当前选中的配置文件名
- isConfigModified: boolean
  - 配置是否被修改
- isEditing: boolean
  - 是否正在编辑历史记录
- adminInputs: object
  - 管理员输入配置
- userInputs: object
  - 用户输入配置
- promptBlocks: array
  - 提示词块配置
- inputCounter: number
  - 输入框计数器

#### Events
- update:model-value: 更新选中的配置文件
- config-loaded: 配置加载完成
- update:adminInputs: 更新管理员输入
- update:userInputs: 更新用户输入
- update:promptBlocks: 更新提示词块
- update:inputCounter: 更新计数器

### 3. InputPanel.vue

#### 功能描述
处理用户输入表单，管理输入框的显示和数据同步。

#### Props
- userInputs: object
  - 用户输入数据
- adminInputs: object
  - 管理员输入配置

#### Events
- update:userInputs: 更新用户输入数据

### 4. ExecutionPanel.vue

#### 功能描述
处理执行状态和并行模式显示，管理执行过程的可视化。

#### Props
- isEditing: boolean
  - 是否正在编辑历史记录
- isParallelMode: boolean
  - 是否为并行模式
- blockStatuses: array
  - 块状态数组
- isAllBlocksCompleted: boolean
  - 是否所有块都已完成
- hasUserInputs: boolean
  - 是否有用户输入

#### Events
- execute: 触发执行操作

### 5. OutputPanel.vue

#### 功能描述
处理输出结果的显示和复制功能，支持Markdown渲染和实时更新。

#### Props
- outputResult: string
  - 输出结果内容
- blockStatuses: array
  - 块状态数组

## 组件通信

### 数据流
1. 向下数据流
   - 通过props传递数据
   - 父组件管理共享状态
   - 子组件只读取props

2. 向上数据流
   - 使用emit发送事件
   - 子组件不直接修改props
   - 通过事件通知状态变化

### 状态管理
1. 本地状态
   - 使用ref/reactive管理
   - 保持状态最小化
   - 及时清理无用状态

2. 共享状态
   - 提升到父组件
   - 通过props分发
   - 统一的更新机制

## 样式指南

### 1. 布局规范
- 使用flex布局
- 避免固定宽高
- 响应式设计
- 合理的间距

### 2. 样式隔离
- 使用scoped特性
- BEM命名规范
- 避免样式污染
- 主题变量统一

### 3. 交互设计
- 清晰的视觉反馈
- 合理的动画效果
- 友好的错误提示
- 一致的交互模式

## 最佳实践

### 1. 组件设计
- 单一职责原则
- 接口清晰明确
- 保持组件独立
- 避免过度耦合

### 2. 性能优化
- 合理的更新粒度
- 避免不必要的渲染
- 及时清理资源
- 优化事件处理

### 3. 代码质量
- TypeScript类型定义
- 完整的注释
- 统一的代码风格
- 模块化组织

## 注意事项

1. 组件使用
   - 正确的props传递
   - 合理的事件处理
   - 注意生命周期
   - 避免副作用

2. 状态管理
   - 谨慎使用watch
   - 合理的默认值
   - 状态初始化时机
   - 防止状态混乱

3. 性能考虑
   - 避免深层props
   - 合理的计算属性
   - 优化渲染性能
   - 资源及时释放
