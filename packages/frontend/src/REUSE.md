# 项目复用情况文档

## 组件复用

### 1. HistoryPanel组件 (src/components/HistoryPanel.vue)
- **用途**：通用历史记录管理面板
- **复用策略**：
  - 通过storage-key实现多模块独立存储
  - 统一的历史记录数据结构
  - 标准化的事件接口
- **主要功能**：
  - 创建新对话
  - 选择历史记录
  - 编辑历史记录
  - 自动存储管理
- **复用示例**：
  - src/views/sn43/SN43View.vue：提示词生成的历史记录管理
  - src/views/chat/ChatView.vue：AI对话的历史记录管理

### 2. SN43View组件体系 (src/views/sn43/)
- **组件拆分**：
  1. SN43View.vue（主组件）
     - 整体布局和状态管理
     - 协调子组件通信
     - 处理历史记录的保存和恢复
  2. UserInterface.vue（用户界面组件）
     - 处理用户输入和配置项
     - 管理多块提示词的执行
     - 支持Markdown格式的结果显示
     - 提供结果复制功能
  3. ConfigPanel.vue（配置面板组件）
     - 管理提示词模板配置
     - 处理配置的导入导出
     - 提供配置重置功能

## 组合式函数复用

### 1. useStreamResponse (src/composables/useStreamResponse.ts)
- **功能**：统一的AI流式响应处理
- **复用特性**：
  - Markdown实时渲染
  - 流式内容动态更新
  - 支持单块/多块响应
  - 统一的加载状态管理
  - 标准化的错误处理
- **应用场景**：
  - src/views/chat/ChatView.vue：单一对话流模式
    * 实现连续对话界面
    * 消息列表形式展示
    * 实时追加响应内容
    * 支持用户-AI对话交互
  - src/components/sn43/UserInterface.vue：多块执行模式
    * 支持多个提示词块并行处理
    * 独立的块状态管理
    * 适用于批量生成内容场景
    * 支持结果的分块展示
- **核心流程**：
  1. 接收prompt输入（单个或多个）
  2. 创建初始输出容器（消息或块）
  3. 处理流式响应数据
  4. 实时渲染markdown内容
  5. 管理加载状态（显示loading图标）
  6. 处理完成/错误标记（[DONE]/[ERROR]）

### 2. useHistory (src/composables/useHistory.ts)
- **功能**：历史记录管理
- **复用特性**：
  - 多模块存储隔离（基于storage-key）
  - 统一的历史记录数据结构
  - 自动时间戳管理
  - 历史记录CRUD操作
- **应用场景**：
  - src/views/chat/ChatView.vue：对话历史管理
    * 存储对话记录
    * 恢复历史对话
    * 管理对话列表
  - src/views/sn43/SN43View.vue：提示词执行历史
    * 记录执行结果
    * 恢复历史配置
    * 管理执行记录

### 3. useExecution (src/composables/useExecution.ts)
- **功能**：基于流式响应的执行逻辑
- **复用特性**：
  - 执行状态管理（isExecuting, currentBlockIndex）
  - 提示词模板处理
  - 执行上下文维护
  - 批量执行支持
  - 实时内容更新（blockContents）
  - 响应式状态同步
- **应用场景**：
  - src/components/sn43/UserInterface.vue：
    * 处理多块提示词执行
    * 管理执行状态
    * 协调流式响应
    * 处理执行结果
    * 实时内容渲染
    * 状态同步管理
- **核心流程**：
  1. 初始化BlockManager和响应式状态
  2. 处理用户输入和提示词
  3. 执行流式请求
  4. 实时更新blockContents
  5. 触发视图更新
  6. 管理执行状态
- **最佳实践**：
  - 遵循Services -> Composables -> Components数据流
  - 利用Vue响应式系统
  - 避免直接DOM操作
  - 保持状态同步

### 4. usePrompt (src/composables/usePrompt.ts)
- **功能**：提示词管理
- **复用特性**：
  - 提示词模板解析
  - 变量占位符处理
  - 实时预览支持
  - 模板验证功能
- **应用场景**：
  - src/views/sn43/SN43View.vue：
    * 管理提示词模板
    * 处理用户输入替换
    * 提供预览功能
    * 验证模板格式

### 5. useConfig (src/composables/useConfig.ts)
- **功能**：配置管理
- **复用特性**：
  - JSON配置导入导出
  - 默认配置加载（public/sn4+3.json）
  - 配置验证和重置
  - 配置持久化存储
- **应用场景**：
  - src/components/sn43/ConfigPanel.vue：
    * 管理提示词配置
    * 处理配置导入导出
    * 维护默认配置
    * 提供重置功能

## 样式复用

### 1. 布局规范
- **通用规则**：
  - 顶部导航栏固定60px
  - 使用box-sizing: border-box
  - 优先使用flex布局
  - 避免absolute定位

### 2. 样式组织
- **复用策略**：
  - 通用样式在layout.css
  - 组件样式使用scoped
  - 使用CSS变量实现主题定制

## 最佳实践

### 1. 组件复用原则
- 提供清晰的Props和Events接口
- 使用TypeScript类型定义
- 保持组件的独立性
- 避免跨级组件通信

### 2. 状态管理原则
- 集中管理共享状态
- 最小化组件本地状态
- 使用响应式数据
- 保持状态同步
- 遵循分层架构
  * Services层：核心状态管理（如BlockManager）
  * Composables层：业务逻辑和状态协调
  * Components层：UI渲染和用户交互
- 避免跨层直接通信

### 3. 性能优化
- 合理的组件拆分
- 最小化状态更新
- 及时的资源释放
- 使用懒加载

## 类型定义复用

### 1. 聊天相关类型 (src/types/chat.ts)
- **Message接口**：
  - 统一的消息格式定义
  - 支持user/assistant/system角色
  - 复用场景：
    * src/views/chat/ChatView.vue：对话消息格式
    * src/components/sn43/UserInterface.vue：执行结果格式
    * src/composables/useStreamResponse.ts：流式响应格式

- **ChatHistory接口**：
  - 统一的历史记录格式
  - 包含id、title和messages数组
  - 复用场景：
    * src/components/HistoryPanel.vue：历史记录展示
    * src/views/chat/ChatView.vue：对话历史管理
    * src/views/sn43/SN43View.vue：执行历史管理
    * src/composables/useHistory.ts：历史记录存储

## 注意事项

1. **存储管理**
   - 使用唯一的storage-key
   - 注意存储大小限制
   - 定期清理无用数据

2. **错误处理**
   - 统一的错误提示
   - 合理的恢复机制
   - 完善的错误日志

3. **代码维护**
   - 清晰的代码注释
   - 统一的命名规范
   - 模块化的代码组织
