# 测试指南

本项目使用Vitest作为测试框架，为前后端代码提供了完整的单元测试覆盖。

## 后端测试

后端测试主要集中在`packages/backend/src/services/__tests__`目录下，包含以下主要测试：

### ModelService测试

ModelService的测试文件位于`packages/backend/src/services/__tests__/model-service.test.ts`，覆盖了以下功能：

- 单例模式实现
- 配置管理功能
- 模型管理功能
- 温度管理功能
- Headers生成功能
- Token计算功能

## 前端测试

前端测试主要集中在`packages/frontend/src/composables/__tests__`目录下，包含以下主要测试：

### useModelConfig测试

useModelConfig的测试文件位于`packages/frontend/src/composables/__tests__/useModelConfig.test.ts`，覆盖了以下功能：

- 配置加载功能
- 错误处理机制
- 缓存机制
- 默认值处理
- 环境URL处理

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
