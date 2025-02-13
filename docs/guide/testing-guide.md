# 测试指南

本项目使用Vitest作为测试框架，为前后端代码提供了完整的单元测试覆盖。测试设计遵循以下原则：

1. 不影响构建环境：测试过程中的环境变量修改不会影响实际的构建环境
2. 灵活的API配置：测试用例不依赖特定的模型API key，能适应不同的开发环境

## 后端测试

后端测试主要集中在`packages/backend/src/services/__tests__`目录下，包含以下主要测试：

### ModelService测试

ModelService的测试文件位于`packages/backend/src/services/__tests__/model-service.test.ts`，覆盖了以下功能：

- 单例模式实现
- 配置管理功能
  - 动态检测可用的模型配置
  - 自动跳过未配置API key的模型测试
- 模型管理功能
  - 基于实际可用模型进行测试
  - 处理无效模型的情况
- 温度管理功能
  - 验证温度范围的有效性
  - 自适应不同模型的温度设置
- Headers生成功能
  - 支持多种认证格式
  - 处理不同API提供商的token格式
- Token计算功能
  - 通用的token计算逻辑
  - 适配不同模型的最大token限制

特别说明：
- 测试会在运行前保存当前环境变量
- 测试结束后会恢复原始环境变量
- 使用动态检测机制，根据实际配置的API key运行相关测试

## 前端测试

前端测试主要集中在`packages/frontend/src/composables/__tests__`目录下，包含以下主要测试：

### useModelConfig测试

useModelConfig的测试文件位于`packages/frontend/src/composables/__tests__/useModelConfig.test.ts`，覆盖了以下功能：

- 配置加载功能
  - 使用通用的mock配置
  - 不依赖特定模型名称
- 错误处理机制
  - 处理配置加载失败
  - 处理无效模型配置
- 缓存机制
  - 验证配置缓存功能
  - 确保缓存数据一致性
- 默认值处理
  - 提供合理的默认配置
  - 处理配置缺失情况
- 环境URL处理
  - 支持不同环境的API地址
  - 处理开发和生产环境差异

## 运行测试

### 后端测试

```bash
cd packages/backend
npm run test
```

### 前端测试

```bash
cd packages/frontend
npm run test
```

## 测试覆盖率

要生成测试覆盖率报告，可以运行：

### 后端测试覆盖率

```bash
cd packages/backend
npm run test:coverage
```

### 前端测试覆盖率

```bash
cd packages/frontend
npm run test:coverage
```

## 编写新测试

1. 测试文件应放在与被测试代码相同的目录结构下的`__tests__`目录中
2. 测试文件名应以`.test.ts`结尾
3. 使用`describe`块组织相关的测试用例
4. 使用`it`或`test`编写具体的测试用例
5. 使用`beforeEach`和`afterEach`处理测试前后的设置和清理工作
6. 使用`vi.mock()`进行模块模拟
7. 使用`vi.spyOn()`监视函数调用
8. 使用`expect()`进行断言

## 最佳实践

1. 每个测试用例应该只测试一个功能点
2. 测试用例应该是独立的，不应该依赖其他测试用例的状态
3. 使用有意义的测试用例名称
4. 在测试用例中使用有意义的变量名
5. 使用mock来隔离外部依赖
6. 测试边界条件和错误情况
7. 保持测试代码的简洁和可读性
8. 定期运行测试并保持测试通过

## 环境变量处理

1. 测试环境变量
   - 测试开始前保存当前环境变量
   - 测试结束后恢复原始环境变量
   - 使用临时的测试专用API key

2. API Key配置
   - 不要在测试中写死特定的API key
   - 使用动态检测机制适应不同的配置
   - 优雅处理API key缺失的情况

3. 最佳实践
   - 使用.env.example提供配置示例
   - 在文档中说明所需的环境变量
   - 提供获取API key的指导说明
