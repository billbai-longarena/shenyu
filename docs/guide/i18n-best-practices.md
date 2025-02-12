# i18n 最佳实践

## 语言状态管理

### 1. 全局状态

使用全局的响应式状态来管理语言设置，避免状态分散：

```typescript
// useLanguage.ts
const globalLanguageState = reactive({
    current: 'en' as 'en' | 'zh'
})

export function useLanguage() {
    // 提供只读的语言状态
    provide('languageState', readonly(globalLanguageState))
    
    // 导出计算属性以保持响应式
    const currentLanguage = computed({
        get: () => globalLanguageState.current,
        set: (value) => { globalLanguageState.current = value }
    })
}
```

### 2. 依赖注入

在组件或composable中使用inject获取语言状态：

```typescript
const languageState = inject<{ current: 'en' | 'zh' }>('languageState')
if (!languageState) {
    throw new Error('languageState not provided')
}
```

### 3. 计算属性

使用computed属性来派生语言相关的值，确保响应式：

```typescript
// 计算当前语言目录
const currentDir = computed(() => {
    const dir = languageState.current === 'en' ? 'item_EN' : 'item_CN'
    return dir
})

// 计算默认文件名
const defaultFile = computed(() => {
    return languageState.current === 'en' 
        ? 'example.json' 
        : '示例.json'
})
```

## 资源加载

### 1. 目录结构

按语言分离资源文件：

```
public/
  ├── item_EN/
  │   ├── file1.json
  │   └── file2.json
  └── item_CN/
      ├── file1.json
      └── file2.json
```

### 2. 缓存控制

在加载资源时添加缓存控制：

```typescript
const response = await fetch(url, {
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    },
    cache: 'no-store'
})
```

### 3. URL编码

确保正确处理非ASCII文件名：

```typescript
const encodedFilename = `${dir}/${encodeURIComponent(file.filename)}`
```

## 语言切换

### 1. 状态清理

在语言切换时清理相关状态：

```typescript
watch(() => languageState.current, (newLang) => {
    // 清空需要重新加载的数据
    jsonFiles.value = []
})
```

### 2. 延迟加载

不要在语言切换时立即加载所有资源，而是等待用户操作：

```typescript
const onSelectClick = async () => {
    if (!jsonFiles.value.length) {
        await fetchJsonFiles()
    }
}
```

### 3. 事件通知

使用自定义事件通知语言变化：

```typescript
window.dispatchEvent(new CustomEvent('language-changed', { 
    detail: newLang 
}))
```

## 调试与日志

添加详细的日志来跟踪语言相关的操作：

```typescript
console.log('[useJsonFiles] 开始获取文件列表', {
    当前语言: languageState.current,
    目录: dir
})
```

## 常见问题

1. **响应式断链**
   - 问题：使用普通变量存储语言状态导致响应式丢失
   - 解决：使用computed属性和reactive确保响应式链完整

2. **缓存问题**
   - 问题：浏览器缓存导致语言切换后仍显示旧内容
   - 解决：添加时间戳和缓存控制头部

3. **状态同步**
   - 问题：多个组件的语言状态不同步
   - 解决：使用全局状态和依赖注入

4. **文件编码**
   - 问题：中文文件名加载失败
   - 解决：使用encodeURIComponent处理文件名

## 实际案例分析

### 动态加载JSON配置文件

以下是一个完整的示例，展示如何在Vue3应用中实现多语言JSON配置文件的动态加载：

1. **语言状态管理 (useLanguage.ts)**
```typescript
// 全局状态
const globalLanguageState = reactive({
    current: 'en' as 'en' | 'zh'
})

export function useLanguage() {
    // 提供只读状态
    provide('languageState', readonly(globalLanguageState))
    
    // 切换语言
    const toggleLanguage = async () => {
        const newLang = globalLanguageState.current === 'en' ? 'zh' : 'en'
        await saveDefaultLanguage(newLang)
        globalLanguageState.current = newLang
        // 通知其他组件
        window.dispatchEvent(new CustomEvent('language-changed', { detail: newLang }))
    }
}
```

2. **文件加载管理 (useJsonFiles.ts)**
```typescript
export function useJsonFiles() {
    const languageState = inject<{ current: 'en' | 'zh' }>('languageState')
    
    // 使用computed确保响应式
    const currentDir = computed(() => 
        languageState.current === 'en' ? 'item_EN' : 'item_CN'
    )
    
    // 延迟加载策略
    const fetchJsonFiles = async () => {
        const dir = currentDir.value
        const timestamp = new Date().getTime()
        const url = `/${dir}/json-files-list.json?t=${timestamp}`
        // ... 加载文件列表
    }
}
```

3. **组件实现 (ConfigSelector.vue)**
```typescript
const onSelectClick = async () => {
    // 仅在需要时加载
    if (!jsonFiles.value.length) {
        await fetchJsonFiles()
    }
}
```

### 性能优化建议

1. **预加载关键资源**
```typescript
// 在应用启动时预加载当前语言的关键资源
onMounted(async () => {
    const criticalResources = ['common.json', 'menu.json']
    await Promise.all(criticalResources.map(loadResource))
})
```

2. **缓存策略**
```typescript
// 实现内存缓存
const resourceCache = new Map()

const loadResource = async (path: string) => {
    const cacheKey = `${currentLanguage.value}:${path}`
    if (resourceCache.has(cacheKey)) {
        return resourceCache.get(cacheKey)
    }
    const data = await fetchResource(path)
    resourceCache.set(cacheKey, data)
    return data
}
```

3. **错误处理**
```typescript
const loadTranslation = async () => {
    try {
        const data = await fetchJsonFiles()
        return data
    } catch (error) {
        console.error('Failed to load translation:', error)
        // 回退到默认语言
        return fallbackToDefaultLanguage()
    }
}
```

## 最佳实践检查清单

### 基础配置
- [ ] 使用全局响应式状态管理语言
- [ ] 通过依赖注入共享语言状态
- [ ] 使用computed属性处理派生值

### 资源管理
- [ ] 实现适当的缓存控制
- [ ] 正确处理非ASCII字符
- [ ] 实现资源预加载策略
- [ ] 添加内存缓存机制

### 性能优化
- [ ] 实现延迟加载策略
- [ ] 避免不必要的资源重载
- [ ] 优化资源包大小

### 用户体验
- [ ] 添加加载状态指示
- [ ] 实现平滑的语言切换过程
- [ ] 保存用户语言偏好

### 开发支持
- [ ] 添加完整的日志跟踪
- [ ] 实现开发环境调试工具
- [ ] 提供语言切换事件钩子

### 错误处理
- [ ] 实现优雅的错误降级
- [ ] 添加资源加载重试机制
- [ ] 提供默认语言回退

## 调试和问题排查指南

### 1. 调试工具

#### Vue Devtools
- 检查语言状态的响应式变化
- 监控组件重新渲染
- 观察computed属性的计算过程

#### 浏览器开发者工具
- Network面板：监控资源加载
- Console面板：查看日志输出
- Application面板：检查缓存状态

### 2. 常见问题排查流程

#### 语言切换无效
1. 检查日志输出：
```typescript
console.log('[useLanguage] 全局语言状态变化', {
    旧语言: oldLang,
    新语言: newLang
})
```

2. 确认事件触发：
```typescript
window.addEventListener('language-changed', (event) => {
    console.log('语言变化事件:', event.detail)
})
```

3. 验证状态更新：
```typescript
watch(() => languageState.current, (newLang) => {
    console.log('语言状态变化:', newLang)
})
```

#### 资源加载失败
1. 检查网络请求：
```typescript
console.log('[useJsonFiles] 请求URL:', url, {
    headers: requestHeaders,
    cache: 'no-store'
})
```

2. 验证文件路径：
```typescript
console.log('[useJsonFiles] 文件路径:', {
    目录: currentDir.value,
    编码前: filename,
    编码后: encodedFilename
})
```

3. 测试文件可访问性：
```typescript
async function testFileAccess(path: string) {
    try {
        const response = await fetch(path)
        console.log('文件访问测试:', {
            路径: path,
            状态: response.status,
            成功: response.ok
        })
    } catch (error) {
        console.error('文件访问失败:', error)
    }
}
```

### 3. 性能问题排查

#### 加载性能
1. 添加时间戳日志：
```typescript
const startTime = performance.now()
await fetchJsonFiles()
const endTime = performance.now()
console.log('资源加载耗时:', endTime - startTime)
```

2. 监控资源缓存：
```typescript
console.log('缓存状态:', {
    缓存数量: resourceCache.size,
    缓存键列表: Array.from(resourceCache.keys())
})
```

#### 内存泄漏
1. 清理监听器：
```typescript
onBeforeUnmount(() => {
    window.removeEventListener('language-changed', handleLanguageChange)
    resourceCache.clear()
})
```

2. 监控内存使用：
```typescript
console.log('内存使用:', {
    已缓存资源: resourceCache.size,
    文件列表大小: jsonFiles.value.length
})
```

### 4. 开发环境配置

#### 调试模式
```typescript
const isDev = process.env.NODE_ENV === 'development'
const debug = {
    logLevel: isDev ? 'debug' : 'error',
    showInternals: isDev,
    validateResources: isDev
}
```

#### 资源验证
```typescript
function validateResource(resource: any) {
    if (debug.validateResources) {
        console.log('资源验证:', {
            类型: typeof resource,
            结构: Object.keys(resource),
            大小: JSON.stringify(resource).length
        })
    }
}
```

这些调试工具和技巧可以帮助你快速定位和解决i18n相关的问题。记住在生产环境中移除或禁用调试代码。
