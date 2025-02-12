# 状态管理和新增功能的最佳实践 [中文] | [English](state-management-best-practices.en.md)

本文档总结了在项目中进行状态管理和添加新功能时的最佳实践，以切换语言时触发新对话功能的实现为例。

## 1. 全局状态管理

### 1.1 使用Vue的响应式API

对于需要在多个组件间共享的状态，我们使用Vue的`reactive`和`provide/inject`机制：

```typescript
// 创建全局状态
const globalState = reactive({
    someState: initialValue
})

// 提供状态（在父组件或入口文件中）
provide('stateKey', readonly(globalState))

// 注入状态（在子组件中）
const state = inject('stateKey')
```

### 1.2 使用Composables封装状态逻辑

将相关的状态和逻辑封装在Composables中，提供清晰的API：

```typescript
// useFeature.ts
export function useFeature() {
    const state = reactive({...})
    const someMethod = () => {...}
    
    return {
        state,
        someMethod
    }
}
```

## 2. 跨组件通信

### 2.1 使用自定义事件

对于需要在不同组件间通信的功能，使用自定义事件是一个好选择：

```typescript
// 触发事件
window.dispatchEvent(new CustomEvent('event-name', {
    detail: {
        // 事件数据
        someFlag: true,
        someData: data
    }
}))

// 监听事件
const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{someFlag: boolean, someData: any}>
    if (customEvent.detail?.someFlag) {
        // 处理事件
    }
}

onMounted(() => {
    window.addEventListener('event-name', handleEvent)
})

onUnmounted(() => {
    window.removeEventListener('event-name', handleEvent)
})
```

### 2.2 事件数据类型定义

为自定义事件的数据定义清晰的类型：

```typescript
interface EventDetail {
    someFlag: boolean
    someData: any
}

const customEvent = event as CustomEvent<EventDetail>
```

## 3. 新功能实现流程

### 3.1 分析现有代码结构

在添加新功能前，先分析现有的代码结构：
- 查看相关的组件和服务
- 了解现有的状态管理方式
- 识别可能受影响的部分

### 3.2 选择合适的实现方式

根据功能的特点选择合适的实现方式：
- 如果是多个组件共享的状态，使用全局状态管理
- 如果是组件间的通信，考虑使用事件机制
- 如果是独立的功能，可以封装在Composable中

### 3.3 保持代码一致性

新功能的实现应该遵循项目的既有模式：
- 保持相似功能的实现方式一致
- 复用现有的工具和方法
- 保持代码风格的统一

## 4. 实际案例：语言切换触发新对话

### 4.1 需求分析

需要在切换语言时同时触发新对话功能，涉及：
- 语言切换功能（已有）
- 新对话功能（已有）
- 两个功能的关联（新增）

### 4.2 实现方案

1. 扩展现有的语言切换事件：
```typescript
// useLanguage.ts
const toggleLanguage = async () => {
    // ... 语言切换逻辑 ...
    window.dispatchEvent(new CustomEvent('language-changed', {
        detail: {
            lang: newLang,
            shouldStartNewChat: true
        }
    }))
}
```

2. 在需要响应的组件中添加事件监听：
```typescript
// 在相关组件中
const handleLanguageChange = async (event: Event) => {
    const customEvent = event as CustomEvent<{lang: string; shouldStartNewChat: boolean}>
    if (customEvent.detail?.shouldStartNewChat) {
        await startNewChat()
    }
}

onMounted(() => {
    window.addEventListener('language-changed', handleLanguageChange)
})
```

### 4.3 优势

这种实现方式的优势：
- 保持了代码的解耦性
- 易于在其他组件中复用
- 遵循了既有的编程模式
- 类型安全
- 易于测试和维护

## 5. 总结

在添加新功能时：
1. 优先考虑使用现有的状态管理方式
2. 使用TypeScript确保类型安全
3. 通过事件机制实现松耦合的组件通信
4. 保持代码风格和实现方式的一致性
5. 编写清晰的文档，方便其他开发者理解和维护
