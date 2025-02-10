# Shenyu AI服务插件开发指南

## 概述

Shenyu支持通过插件系统扩展AI服务提供者。本指南将帮助你了解如何创建新的AI服务插件。

## 插件架构

Shenyu的AI服务插件系统基于以下核心组件：

- `AIProvider` 接口：定义了AI服务提供者必须实现的方法
- `BaseAIService` 抽象类：提供了基础功能实现
- `StreamHandler` 接口：定义了处理流式响应的方法

## 创建新插件

### 1. 创建插件目录

在 `src/plugins` 目录下创建新的目录，例如：

```bash
mkdir src/plugins/your-provider
```

### 2. 实现服务类

创建一个继承自 `BaseAIService` 的新类：

```typescript
import { Message, ModelType } from '../../types/api.js';
import { StreamHandler } from '../../core/types/ai.js';
import { BaseAIService } from '../../core/services/base-ai-service.js';

export class YourAIService extends BaseAIService {
    constructor() {
        super();
        // 初始化你的服务
    }

    public async streamRequest(
        sessionId: string,
        model: ModelType,
        messages: Message[],
        temperature: number,
        max_tokens: number,
        handler: StreamHandler
    ): Promise<void> {
        // 实现你的服务逻辑
    }
}
```

### 3. 处理会话验证

使用基类提供的方法验证会话：

```typescript
if (!this.validateSession(sessionId)) {
    handler.onError('Session not found');
    return;
}
```

### 4. 实现流式响应

使用 `StreamHandler` 接口处理响应：

```typescript
handler.onChunk(chunk); // 发送响应片段
handler.onError(error); // 发送错误
handler.onComplete();   // 完成响应
```

### 5. 更新流位置

使用基类提供的方法更新流位置：

```typescript
this.updateStreamPosition(sessionId, position);
```

## 示例实现

以下是一个简单的示例实现：

```typescript
export class ExampleAIService extends BaseAIService {
    public async streamRequest(
        sessionId: string,
        model: ModelType,
        messages: Message[],
        temperature: number,
        max_tokens: number,
        handler: StreamHandler
    ): Promise<void> {
        if (!this.validateSession(sessionId)) {
            handler.onError('Session not found');
            return;
        }

        try {
            const response = await this.callExternalAPI({
                messages,
                temperature,
                max_tokens
            });

            let position = 0;
            for await (const chunk of response.body) {
                position += chunk.length;
                this.updateStreamPosition(sessionId, position);
                handler.onChunk(chunk);
            }

            handler.onComplete();
        } catch (error) {
            handler.onError(error instanceof Error ? error.message : 'Unknown error');
        }
    }
}
```

## 注册插件

在 `core/services/ai-service.ts` 中注册你的插件：

```typescript
import { YourAIService } from '../../plugins/your-provider/your-ai-service.js';

class AIService {
    private yourService: YourAIService;

    constructor() {
        this.yourService = new YourAIService();
    }

    public async streamRequest(...) {
        if (model === 'your-model') {
            return this.yourService.streamRequest(...);
        }
    }
}
```

## 最佳实践

1. 错误处理
   - 始终使用try-catch包装API调用
   - 提供有意义的错误消息
   - 在出错时正确清理资源

2. 会话管理
   - 总是验证会话
   - 正确更新流位置
   - 处理会话超时

3. 性能优化
   - 合理使用缓存
   - 避免内存泄漏
   - 实现适当的重试机制

4. 安全性
   - 安全存储API密钥
   - 验证用户输入
   - 实现速率限制

## 测试

1. 单元测试
```typescript
import { YourAIService } from './your-ai-service';

describe('YourAIService', () => {
    let service: YourAIService;
    
    beforeEach(() => {
        service = new YourAIService();
    });

    it('should handle stream request', async () => {
        const handler = {
            onChunk: jest.fn(),
            onError: jest.fn(),
            onComplete: jest.fn()
        };

        await service.streamRequest(
            'test-session',
            'your-model',
            [{ role: 'user', content: 'test' }],
            0.7,
            100,
            handler
        );

        expect(handler.onChunk).toHaveBeenCalled();
        expect(handler.onComplete).toHaveBeenCalled();
        expect(handler.onError).not.toHaveBeenCalled();
    });
});
```

2. 集成测试
```typescript
import { AIService } from '../../core/services/ai-service';

describe('AI Service Integration', () => {
    it('should route to correct provider', async () => {
        const service = AIService.getInstance();
        const handler = {
            onChunk: jest.fn(),
            onError: jest.fn(),
            onComplete: jest.fn()
        };

        await service.streamRequest(
            'test-session',
            'your-model',
            [{ role: 'user', content: 'test' }],
            0.7,
            100,
            handler
        );

        expect(handler.onComplete).toHaveBeenCalled();
    });
});
```

## 故障排除

常见问题及解决方案：

1. 会话验证失败
   - 检查会话ID是否正确
   - 确认会话未过期
   - 验证会话存储是否正常工作

2. 流式响应问题
   - 确保正确处理所有数据块
   - 检查网络连接
   - 验证API响应格式

3. 性能问题
   - 检查内存使用
   - 监控响应时间
   - 优化数据处理逻辑

## 更多资源

- [API文档](/docs/api/chat-completions.md)
- [核心概念](/docs/guide/index.md)
- [示例代码](/docs/examples)
