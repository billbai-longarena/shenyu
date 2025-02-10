# 模型配置重构指南

## 背景

原先的设计中，模型的配置（包括maxTokens等）存储在前端的`public/model-defaults.json`文件中。这种设计存在以下问题：

1. 配置分散 - 部分配置在前端JSON文件中，部分在后端代码中
2. 维护困难 - 需要同时维护前后端的配置
3. 配置不一致 - 可能导致前后端配置不同步

## 重构方案

### 1. 配置分离

将配置分为两类：
- 用户偏好设置：存储在`model-defaults.json`中
  - defaultModel：用户默认选择的模型
  - defaultTemperature：用户默认的温度设置

- 模型技术参数：存储在后端`model-service.ts`中
  - maxTokens：模型支持的最大token数
  - url：API端点
  - temperatureRange：温度范围配置

### 2. 后端API设计

创建新的`model-config`路由来提供模型配置：

```typescript
router.get('/', (req, res) => {
    const configs = modelService.getAllConfigs();
    const modelConfigs = Object.entries(configs).reduce((acc, [model, config]) => {
        acc[model] = {
            maxTokens: config.maxTokens,
            temperatureRange: config.temperatureRange
        };
        return acc;
    }, {});
    res.json({ modelConfigs });
});
```

### 3. 前端改造

修改`useModelConfig`组合式函数，从后端API获取配置：

```typescript
async function loadModelConfigs(): Promise<ModelConfigs> {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const port = import.meta.env.PROD ? '' : ':3001';
    const response = await fetch(`${protocol}//${window.location.hostname}${port}/api/model-config`);
    const configs = await response.json();
    return configs;
}
```

### 4. 环境变量处理

确保环境变量在应用启动时正确加载：

```typescript
// 加载环境变量
const envPath = join(__dirname, '../.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

// 重新初始化ModelService以确保它使用新的环境变量
const modelService = ModelService.getInstance();
modelService.reloadConfig();
```

## 最佳实践

1. **关注点分离**
   - 用户偏好设置（如默认选择）放在前端
   - 技术参数配置（如maxTokens）放在后端

2. **配置集中管理**
   - 所有模型相关的技术参数统一在`ModelService`中管理
   - 用户偏好设置统一在`model-defaults.json`中管理

3. **类型安全**
   - 使用TypeScript接口定义配置结构
   - 在前后端之间保持一致的类型定义

4. **错误处理**
   - 添加适当的错误处理和日志记录
   - 提供合理的默认值作为后备方案

5. **环境变量管理**
   - 在应用启动时验证必要的环境变量
   - 使用.env文件管理环境变量
   - 提供.env.example作为模板

## 注意事项

1. 在修改配置结构时，需要同时更新前后端的类型定义
2. 保持`model-defaults.json`文件的向后兼容性
3. 在部署时确保环境变量正确配置
4. 定期清理不再使用的配置代码

## 后续优化建议

1. 添加配置验证机制
2. 实现配置热重载功能
3. 添加配置变更日志
4. 实现配置版本控制
5. 添加配置监控和告警机制
