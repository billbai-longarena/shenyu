# 新增大模型最佳实践 [中文]

本文档介绍了在Shenyu项目中添加新的大语言模型的最佳实践流程。

## 步骤概述

1. API验证
2. 类型定义
3. 模型配置
4. 前端集成
5. 测试验证

## 详细步骤

### 1. API验证

在开始集成之前，首先验证API的可用性：

```bash
# 使用curl测试API
curl -X POST "API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "model-name",
    "messages": [
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
  }'
```

确认以下内容：
- API端点是否可访问
- 认证方式是否正确
- 响应格式是否符合预期

### 2. 类型定义

1. 在前端添加模型类型 (`packages/frontend/src/api/api-deepseekStream.ts`):
```typescript
export type ModelType = 'existing-models' | 'new-model-name';
```

2. 在后端添加模型类型 (`packages/backend/src/types/api.ts`):
```typescript
export type ModelType = 'existing-models' | 'new-model-name';
```

### 3. 模型配置

在后端配置文件中添加新模型配置 (`packages/backend/src/services/model-service.ts`):

```typescript
'new-model-name': {
    apiKey: process.env.NEW_MODEL_API_KEY || '',
    url: 'https://api.example.com/v1/chat/completions',
    model: 'model-name',
    maxTokens: 8096,
    temperatureRange: {
        min: 0,
        max: 2.0,
        default: 1,
        presets: {
            conservative: 0.5,
            balanced: 1.0,
            creative: 1.5
        }
    }
}
```

关键配置说明：
- `apiKey`: 环境变量中的API密钥
- `url`: API端点
- `model`: 模型标识符
- `maxTokens`: 最大token数量
- `temperatureRange`: 温度范围配置
  - `min`: 最小温度值
  - `max`: 最大温度值
  - `default`: 默认温度值
  - `presets`: 预设温度值（保守、平衡、创意）

### 4. 前端集成

在App.vue中添加模型选项：

```typescript
const modelOptions = ref<ModelOption[]>([
  // 现有模型...
  { 
    label: '新模型显示名称', 
    value: 'new-model-name', 
    speed: { status: 'none' } 
  }
]);
```

更新温度设置逻辑：

```typescript
if (selectedModel.value === 'new-model-name') {
    selectedTemperature.value = 1  // 设置默认温度
}
```

### 5. 测试验证

1. 环境变量配置：
```bash
# 在.env文件中添加API密钥
NEW_MODEL_API_KEY="your-api-key"
```

2. 功能测试：
- 模型选择
- 对话功能
- 温度调节
- 速度测试

## 注意事项

1. API认证处理
- 根据API要求设置正确的认证格式
- 在getHeaders方法中添加特殊处理（如果需要）

2. 错误处理
- 添加适当的错误处理逻辑
- 确保用户友好的错误提示

3. 环境变量
- 使用统一的命名规范
- 在文档中说明必要的环境变量

4. 代码风格
- 保持与现有代码一致的风格
- 添加必要的注释

## 示例

以下是添加火山DeepseekV3模型的示例：

1. API验证：
```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "ep-model-id",
    "messages": [
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
  }'
```

2. 类型定义：
```typescript
export type ModelType = 'existing-models' | 'volcesDeepseek';
```

3. 模型配置：
```typescript
'volcesDeepseek': {
    apiKey: process.env.VOLCES_API_KEY || '',
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'ep-model-id',
    maxTokens: 8096,
    temperatureRange: {
        min: 0,
        max: 2.0,
        default: 1,
        presets: {
            conservative: 0.5,
            balanced: 1.0,
            creative: 1.5
        }
    }
}
```

4. 前端集成：
```typescript
const modelOptions = ref<ModelOption[]>([
  // 其他模型...
  { 
    label: '火山DeepseekV3', 
    value: 'volcesDeepseek', 
    speed: { status: 'none' } 
  }
]);
```

## 常见问题

1. API认证失败
- 检查API密钥格式
- 验证环境变量是否正确加载
- 确认认证头格式是否正确

2. 响应解析错误
- 检查API响应格式
- 确保流式响应处理正确

3. 温度设置问题
- 验证温度范围配置
- 检查预设值是否合适

4. 性能问题
- 监控响应时间
- 检查并发处理
- 优化token限制

## 参考资料

- [API文档](docs/api/chat-completions.md)
- [状态管理最佳实践](docs/guide/state-management-best-practices.md)
- [开发指南](docs/guide/index.md)
