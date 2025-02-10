# 执行面板组件说明

## 功能概述
执行面板组件是智能体页面的核心组件，负责处理用户输入的执行操作，管理执行状态，并展示执行结果。

## 实现架构

### WebSocket架构
1. 连接管理（ExecuteButtonWebSocket）
   - 专用的WebSocket连接池
   - 统一的连接接口：getConnection(blockIndex, model)
   - 连接标识格式：execution_block${blockIndex}_${timestamp}
   - 自动的连接清理机制（30秒超时）

2. 并发控制（ExecuteButtonQueue）
   - 默认并发数为2
   - 独立的请求队列管理
   - 指数退避重试机制
   - 完整的错误处理流程

3. 消息处理
   - 统一的消息类型处理
   - 完善的空值检查
   - 标准化的错误提示
   - 实时的状态更新

### 组件结构
```vue
<template>
  <div class="execution-panel">
    <!-- 执行按钮区域 -->
    <div class="button-area">
      <el-button @click="executeAction">执行</el-button>
    </div>
    
    <!-- 执行状态展示 -->
    <div class="status-area">
      <!-- 进度条 -->
      <!-- 状态信息 -->
    </div>
    
    <!-- 执行结果展示 -->
    <div class="result-area">
      <!-- 分块结果 -->
    </div>
  </div>
</template>
```

### 状态管理
1. 执行状态
   - pending: 等待执行
   - streaming: 正在执行
   - completed: 执行完成
   - error: 执行错误

2. 块状态
   - 使用BlockManager管理每个块的状态
   - 支持状态同步验证
   - 实时更新UI显示
   - 错误状态处理

### 执行流程
1. 用户点击执行按钮
2. 检查是否有任务正在执行
3. 初始化BlockManager
4. 处理提示词占位符
5. 根据是否有promptBlock占位符决定执行模式：
   - 有promptBlock：顺序执行
   - 无promptBlock且多块：并行执行（队列模式）

### 并行执行模式
1. 启动队列处理
   - 设置最大并发数为2
   - 初始化执行队列
   - 显示队列处理通知

2. 队列管理
   - 按顺序将块加入队列
   - 等待空闲槽位
   - 处理完成后自动执行下一个

3. 状态同步
   - 实时更新块状态
   - 验证状态同步
   - 处理错误状态
   - 更新进度显示

### 错误处理
1. 重试机制
   - 最大重试次数：3次
   - 指数退避策略
   - 可重试错误判断
   - 错误日志记录

2. 错误展示
   - 错误信息显示
   - 状态更新
   - UI反馈
   - 错误恢复

### 性能优化
1. 连接管理
   - 专用WebSocket连接
   - 自动清理机制
   - 连接复用
   - 超时处理

2. 并发控制
   - 合理的并发限制
   - 队列管理
   - 资源释放
   - 状态同步

3. 内存管理
   - 及时清理资源
   - 避免内存泄漏
   - 状态重置
   - 组件卸载处理

## 使用方法
1. 导入组件
```typescript
import ExecutionPanel from '@/components/sn43/execution/ExecutionPanel.vue'
```

2. 注册组件
```typescript
components: {
  ExecutionPanel
}
```

3. 使用组件
```vue
<execution-panel
  :blocks="promptBlocks"
  :user-inputs="userInputs"
  @execution-complete="handleComplete"
/>
```

## 配置选项
1. 属性
   - blocks: 提示词块数组
   - userInputs: 用户输入对象
   - adminInputs: 管理员输入对象

2. 事件
   - execution-complete: 执行完成事件
   - execution-error: 执行错误事件
   - status-change: 状态变更事件

## 注意事项
1. 执行过程中不要修改输入
2. 等待执行完成再进行新的执行
3. 注意网络状态和错误处理
4. 保持组件状态的同步
