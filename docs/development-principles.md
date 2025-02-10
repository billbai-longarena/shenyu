# Vue 3 + TypeScript 项目开发原则

本文档列出了项目开发中需要遵循的关键原则和最佳实践。

## 命名规范

### 文件命名

1. **Vue组件文件**
   - 使用PascalCase（大驼峰）命名
   - 例如：`UserProfile.vue`, `NavigationBar.vue`
   - 组件名应该是多个单词的组合，避免与HTML元素冲突

2. **TypeScript文件**
   - 使用kebab-case（短横线）命名
   - 例如：`user-service.ts`, `api-types.ts`
   - 特例：类文件可以使用PascalCase，例如：`UserService.ts`

3. **Composables文件**
   - 必须以"use"前缀开头
   - 使用camelCase（小驼峰）命名
   - 例如：`useUserState.ts`, `useAuthentication.ts`
   - 名称应该反映其功能而不是实现细节

4. **工具/服务文件**
   - 使用camelCase命名
   - 相关文件应保持命名一致性
   - 例如：`executeButton.queue.ts`, `executeButton.websocket.ts`

### 变量命名

1. **变量**
   - 使用camelCase命名
   - 使用有意义的英文名称
   - 布尔值应该使用is、has、can等前缀
   - 例如：`userName`, `isLoading`, `hasPermission`

2. **常量**
   - 使用大写字母和下划线
   - 例如：`MAX_COUNT`, `API_BASE_URL`

3. **接口/类型**
   - 使用PascalCase命名
   - 接口名不要以I开头
   - 例如：`UserProfile`, `ApiResponse`

4. **组件Props**
   - 使用camelCase在JavaScript中声明
   - 在模板中使用kebab-case
   - 例如：`userRole` 在JS中，`user-role` 在模板中

### 函数命名

1. **方法/函数**
   - 使用camelCase命名
   - 使用动词开头
   - 例如：`getUserData()`, `updateProfile()`

2. **事件处理函数**
   - 使用handle或on前缀
   - 例如：`handleClick()`, `onSubmit()`

3. **Getter/Setter**
   - 使用get和set前缀
   - 例如：`getUserName()`, `setUserName()`

## 文件组织

1. **目录结构**
   ```
   src/
   ├── assets/          # 静态资源
   ├── components/      # 通用组件
   ├── composables/     # 组合式函数
   ├── services/        # 服务层
   ├── types/          # TypeScript类型定义
   ├── views/          # 页面组件
   └── utils/          # 工具函数
   ```

2. **组件结构**
   - 相关的组件应该放在同一目录下
   - 组件目录可以包含子组件、样式、测试等
   ```
   ComponentName/
   ├── index.vue          # 主组件
   ├── components/        # 子组件
   ├── composables/       # 组件特定的组合式函数
   └── styles/           # 组件样式
   ```

## TypeScript 使用原则

1. **类型定义**
   - 优先使用接口（interface）而不是类型别名（type）
   - 为所有的props定义类型
   - 为复杂的响应式数据定义类型

2. **类型导入/导出**
   - 使用type关键字导入类型
   - 在barrel文件（index.ts）中集中导出类型

3. **泛型使用**
   - 合理使用泛型增加代码复用性
   - 为泛型参数使用有意义的名称

## Vue 3 最佳实践

1. **组合式API**
   - 优先使用`<script setup>`语法
   - 使用组合式函数（Composables）抽取和复用逻辑
   - 保持组件逻辑清晰和功能单一

2. **响应式**
   - 合理使用`ref`和`reactive`
   - 使用`computed`处理派生状态
   - 使用`watch`和`watchEffect`处理副作用

3. **Props和事件**
   - 使用`defineProps`和`defineEmits`声明
   - 遵循单向数据流
   - 使用v-model时遵循命名约定

4. **性能优化**
   - 合理使用`v-show`和`v-if`
   - 使用`v-once`和`v-memo`优化静态内容
   - 使用异步组件处理大型组件

## 代码风格

1. **格式化**
   - 使用ESLint和Prettier保持代码风格一致
   - 使用2空格缩进
   - 在导入语句中使用.js扩展名

2. **注释**
   - 为复杂的业务逻辑添加注释
   - 使用JSDoc风格的注释
   - 及时删除无用的注释

3. **提交规范**
   - 使用语义化的提交消息
   - 遵循约定式提交规范

## 测试原则

1. **单元测试**
   - 为composables编写测试
   - 为复杂的工具函数编写测试
   - 使用Vitest作为测试框架

2. **组件测试**
   - 测试组件的关键功能
   - 测试重要的用户交互
   - 使用组件测试库（如Vue Test Utils）

## 文档规范

1. **代码文档**
   - 为公共API添加JSDoc注释
   - 为复杂的类型定义添加注释
   - 在README中说明组件的用途和用法

2. **项目文档**
   - 维护清晰的README
   - 记录重要的架构决策
   - 提供必要的示例代码
