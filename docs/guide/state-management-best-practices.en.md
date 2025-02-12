# State Management and New Feature Best Practices [English] | [中文](state-management-best-practices.md)

This document summarizes the best practices for state management and adding new features in the project, using the implementation of triggering new chat on language switch as an example.

## 1. Global State Management

### 1.1 Using Vue's Reactive API

For states that need to be shared between multiple components, we use Vue's `reactive` and `provide/inject` mechanism:

```typescript
// Create global state
const globalState = reactive({
    someState: initialValue
})

// Provide state (in parent component or entry file)
provide('stateKey', readonly(globalState))

// Inject state (in child components)
const state = inject('stateKey')
```

### 1.2 Encapsulating State Logic in Composables

Encapsulate related state and logic in Composables, providing a clean API:

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

## 2. Cross-Component Communication

### 2.1 Using Custom Events

For functionality that needs communication between different components, using custom events is a good choice:

```typescript
// Dispatch event
window.dispatchEvent(new CustomEvent('event-name', {
    detail: {
        // Event data
        someFlag: true,
        someData: data
    }
}))

// Listen for event
const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{someFlag: boolean, someData: any}>
    if (customEvent.detail?.someFlag) {
        // Handle event
    }
}

onMounted(() => {
    window.addEventListener('event-name', handleEvent)
})

onUnmounted(() => {
    window.removeEventListener('event-name', handleEvent)
})
```

### 2.2 Event Data Type Definitions

Define clear types for custom event data:

```typescript
interface EventDetail {
    someFlag: boolean
    someData: any
}

const customEvent = event as CustomEvent<EventDetail>
```

## 3. New Feature Implementation Process

### 3.1 Analyzing Existing Code Structure

Before adding new features, analyze the existing code structure:
- Review related components and services
- Understand existing state management approaches
- Identify potentially affected parts

### 3.2 Choosing Appropriate Implementation Method

Choose appropriate implementation method based on feature characteristics:
- Use global state management for state shared across multiple components
- Consider event mechanism for component communication
- Encapsulate independent functionality in Composables

### 3.3 Maintaining Code Consistency

New feature implementation should follow project's existing patterns:
- Keep implementation consistent for similar functionality
- Reuse existing tools and methods
- Maintain uniform code style

## 4. Real Case: Language Switch Triggering New Chat

### 4.1 Requirement Analysis

Need to trigger new chat when switching language, involving:
- Language switching functionality (existing)
- New chat functionality (existing)
- Connection between the two features (new)

### 4.2 Implementation Approach

1. Extend existing language switch event:
```typescript
// useLanguage.ts
const toggleLanguage = async () => {
    // ... language switch logic ...
    window.dispatchEvent(new CustomEvent('language-changed', {
        detail: {
            lang: newLang,
            shouldStartNewChat: true
        }
    }))
}
```

2. Add event listener in relevant components:
```typescript
// In related components
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

### 4.3 Advantages

Advantages of this implementation:
- Maintains code decoupling
- Easy to reuse in other components
- Follows existing programming patterns
- Type-safe
- Easy to test and maintain

## 5. Summary

When adding new features:
1. Prioritize using existing state management approaches
2. Use TypeScript to ensure type safety
3. Implement loosely coupled component communication through events
4. Maintain consistency in code style and implementation approach
5. Write clear documentation for other developers to understand and maintain
