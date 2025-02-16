# 按钮功能说明文档

本文档详细说明了项目中各个按钮的功能实现和相关文件调用关系。

## 1. Execute Button (执行按钮)

### 功能描述
执行按钮用于处理用户输入的提示(prompt)并获取AI模型的响应。它支持并发请求处理，错误重试，以及请求队列管理。

### 核心特性
- 支持最大2个并发请求
- 实现了请求队列管理
- 包含错误重试机制（最多重试3次）
- 支持指数退避策略进行重试（1s, 2s, 4s...，最大10秒）

### 相关文件
1. `src/services/executeButton.queue.ts`
   - 实现请求队列管理
   - 处理请求的排队、执行和重试逻辑
   - 管理并发请求数量
   - 处理错误和重试策略

2. `src/services/executeButton.websocket.ts`
   - 管理WebSocket连接
   - 处理消息的发送和接收
   - 管理事件监听器
   - 实现连接的清理机制

### 工作流程
1. 用户点击执行按钮
2. 系统将请求加入队列（ExecuteButtonQueue）
3. 如果当前活跃请求数小于最大并发数(2)，直接执行
4. 否则等待其他请求完成后再执行
5. 通过WebSocket发送请求到服务器
6. 接收服务器返回的流式响应
7. 处理响应内容或错误情况

## 2. Speed Test Button (速度测试按钮)

### 功能描述
速度测试按钮用于测试不同AI模型的响应速度。它发送固定的测试提示("你好")来评估模型的响应时间。

### 核心特性
- 支持最大4个并发请求
- 实现了请求队列管理
- 包含错误重试机制（最多重试3次）
- 使用指数退避策略进行重试

### 相关文件
1. `src/services/speedTestButton.queue.ts`
   - 实现速度测试请求队列管理
   - 处理测试请求的排队和执行
   - 管理并发测试数量
   - 处理错误和重试策略

2. `src/services/speedTestButton.websocket.ts`
   - 管理速度测试的WebSocket连接
   - 处理测试消息的发送和接收
   - 管理事件监听器
   - 实现连接的清理机制

### 工作流程
1. 用户点击速度测试按钮
2. 系统将测试请求加入队列（SpeedTestButtonQueue）
3. 如果当前活跃测试数小于最大并发数(4)，直接执行
4. 否则等待其他测试完成后再执行
5. 通过WebSocket发送固定测试提示到服务器
6. 接收服务器返回的响应
7. 计算响应时间并展示结果

## 技术实现细节

### WebSocket连接管理
- 两种按钮都使用WebSocket进行实时通信
- 自动处理连接的创建和清理
- 支持HTTPS和HTTP协议（自动选择WSS或WS）
- 实现了30秒超时的连接自动清理机制

### 错误处理
- 支持自动重试机制
- 实现了指数退避策略
- 识别可重试的错误类型：
  - 速率限制（Rate Limit）
  - 请求过多（Too Many Requests）
  - 超时（Timeout）
  - 连接断开（Socket Hang Up）

### 队列管理
- 实现了请求队列系统
- 动态管理并发请求数量
- 支持请求优先级（重试请求优先）
- 提供队列状态监控功能
