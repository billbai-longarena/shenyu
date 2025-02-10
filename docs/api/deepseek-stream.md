# DeepSeek Stream API

## 架构概述
DeepSeek Stream API现已升级为基于WebSocket的架构，提供了更可靠的流式响应和连接管理。系统采用连接池管理和请求队列机制，确保了高并发场景下的稳定性和性能。

## 主要特性

- WebSocket长连接支持
- 智能的连接复用
- 请求队列管理
- 多模型支持
- 完善的错误处理
- 内置的速度测试功能
- HTTP轮询作为备份机制

## WebSocket连接管理

### 连接复用
- 普通请求复用WebSocket连接
- 测速模式使用独立连接
- 自动重连机制
- 连接状态监控

### 支持的模型类型
```typescript
type ModelType = 'deepseek' | 'kimi' | 'yiwan' | 'siliconDeepseek' | 
                'tencentDeepseek' | 'baiduDeepseek' | 'qwen-turbo-latest' | 
                'alideepseekv3' | 'alideepseekr1';
```

## API接口

### 主要函数
```typescript
// 发送AI请求
async function RequestAI(
    model: ModelType,
    prompt: string,
    onChunk: (chunk: string) => void,
    mode?: 'speed_test'
): Promise<void>

// 设置模型
function setModel(model: ModelType): void

// 设置temperature参数
function setTemperature(temp: number): void

// 获取当前模型
function getCurrentModel(): ModelType
```

### WebSocket消息格式

#### 请求格式
```typescript
interface StreamRequest {
    type: 'stream';
    model: ModelType;
    messages: Message[];
    temperature: number;
    max_tokens: number;
    mode?: 'speed_test';
}
```

#### 响应格式
```typescript
interface WebSocketResponse {
    type: 'chunk' | 'error' | 'complete' | 'connectionCount';
    content?: string;        // 用于chunk类型
    message?: string;        // 用于error类型
    count?: number;         // 用于connectionCount类型
}
```

## 使用示例

### 基本使用
```typescript
import { RequestAI, setModel, setTemperature } from './api-deepseekStream';

// 设置模型和参数
setModel('deepseek');
setTemperature(0.7);

// 发送请求
try {
    await RequestAI('deepseek', '你好，你是谁', (chunk: string) => {
        switch(chunk) {
            case '[DONE]':
                console.log('响应完成');
                break;
            case (chunk.startsWith('[ERROR]') && chunk):
                console.error('发生错误:', chunk.slice(7));
                break;
            default:
                console.log('收到内容:', chunk);
        }
    });
} catch (error) {
    console.error('请求失败:', error);
}
```

### 速度测试
```typescript
// 测试单个模型的响应速度
async function testModelSpeed(model: ModelType): Promise<number> {
    const startTime = Date.now();
    let totalChars = 0;
    
    await RequestAI(
        model,
        '你好，你是谁',
        (chunk: string) => {
            if (chunk !== '[DONE]' && !chunk.startsWith('[ERROR]')) {
                totalChars += chunk.length;
            }
        },
        'speed_test'
    );
    
    return (Date.now() - startTime) / totalChars; // ms/字
}
```

## 错误处理

### WebSocket错误处理
```typescript
// 连接错误
ws.onerror = (error) => {
    console.error('WebSocket错误:', error);
};

// 连接断开
ws.onclose = () => {
    console.log('WebSocket连接已关闭');
};

// 消息错误
if (response.type === 'error') {
    console.error('API错误:', response.message);
}
```

### 重试机制
系统内置了自动重试机制：
- 最多重试3次
- 重试间隔1秒
- 支持特定错误类型的重试策略

## 性能优化

### 连接管理
- 默认复用WebSocket连接
- 测速模式使用独立连接
- 自动清理断开的连接
- 智能的连接状态管理

### 并发控制
- 最大并发请求数：4
- 使用请求队列管理超出限制的请求
- 优先级处理机制
- 自动负载均衡

### HTTP轮询备份
- 在WebSocket连接失败时自动切换
- 可配置的轮询间隔
- 支持优雅降级

## 最佳实践

1. 连接管理
   - 在组件挂载时初始化连接
   - 及时清理不需要的连接
   - 正确处理断开重连

2. 错误处理
   - 实现完整的错误处理流程
   - 使用适当的重试策略
   - 提供用户友好的错误提示

3. 性能优化
   - 合理使用连接复用
   - 避免频繁建立新连接
   - 适时清理资源

4. 监控建议
   - 跟踪连接状态
   - 监控响应时间
   - 记录错误率
   - 观察并发数量

## 特殊参数说明

### Temperature参数
- 模型特定范围：
  * kimi模型：0.1-0.9
    - 保守模式：0.1
    - 平衡模式：0.5（默认）
    - 创造模式：0.9
  * deepseek系列：0-1.5
    - 代码生成/数学解题：0.0
    - 数据抽取/分析：1.0
    - 通用对话和翻译：1.3（默认）
    - 创意类写作/诗歌创作：1.5
  * 其他模型：0.1-0.9（默认0.3）

### 注意事项
- 不同模型的参数范围可能不同
- 测速模式会使用特定的连接管理策略
- 需要正确处理连接的生命周期
- 建议在生产环境中启用HTTP轮询备份
