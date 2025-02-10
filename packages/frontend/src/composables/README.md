# 组合式函数文档

[Previous content remains unchanged...]

## useClientCount

### 功能描述
提供WebSocket连接管理和在线用户数显示功能。这个组合式函数集中管理WebSocket连接，处理用户数更新，并提供HTTP轮询作为备份机制。

### 接口定义
```typescript
function useClientCount() {
    return {
        clientCount: Ref<number | null>,     // 当前在线用户数
        updateClientCount: (                 // 更新用户数的函数
            count: number
        ) => void,
        fetchClientCount: () => Promise<void>, // HTTP轮询备份函数
        initWebSocket: () => WebSocket,      // 初始化WebSocket连接
        closeWebSocket: () => void           // 关闭WebSocket连接
    }
}
```

### WebSocket连接管理

#### 1. 连接建立
```typescript
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const port = import.meta.env.PROD ? '' : ':3001'
    const wsUrl = `${protocol}//${window.location.hostname}${port}`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
        // 连接建立后立即请求用户数
        ws.send(JSON.stringify({ type: 'getClientCount' }))
    }
    
    ws.onmessage = (event) => {
        // 处理connectionCount消息
        const response = JSON.parse(event.data)
        if (response.type === 'connectionCount') {
            updateClientCount(response.count)
        }
    }
    
    return ws
}
```

#### 2. 错误处理
```typescript
ws.onerror = (error) => {
    console.error('WebSocket错误:', error)
}

ws.onclose = () => {
    console.log('[WebSocket] 连接已关闭')
    ws = null
}
```

### HTTP轮询备份机制

#### 实现机制
```typescript
async function fetchClientCount() {
    try {
        const port = import.meta.env.PROD ? '' : ':3001'
        const response = await fetch(
            `${window.location.protocol}//${window.location.hostname}${port}/api/client-count`
        )
        const data = await response.json()
        if (data.count !== undefined) {
            updateClientCount(data.count)
        }
    } catch (error) {
        console.error('获取客户端数量失败:', error)
    }
}
```

### 使用示例

1. 基本使用：
```typescript
import { useClientCount } from '../composables/useClientCount'

const { clientCount, initWebSocket, closeWebSocket } = useClientCount()

// 在组件挂载时初始化WebSocket
onMounted(() => {
    initWebSocket()
})

// 在组件卸载时关闭WebSocket
onUnmounted(() => {
    closeWebSocket()
})

// 在模板中显示用户数
<span>在线用户数: {{ clientCount }}</span>
```

2. 带备份机制的使用：
```typescript
const { clientCount, fetchClientCount } = useClientCount()

// 启动HTTP轮询作为备份
let pollTimer = setInterval(fetchClientCount, 1000)

// 记得在组件卸载时清理定时器
onUnmounted(() => {
    clearInterval(pollTimer)
})
```

### 注意事项

1. WebSocket连接管理：
- 确保在组件挂载时初始化连接
- 在组件卸载时正确关闭连接
- 处理连接错误和断开情况
- 避免重复建立连接

2. 用户数更新：
- 使用ref确保响应式更新
- 只在值变化时才更新
- 支持null值表示加载状态
- 保持显示与实际状态同步

3. HTTP轮询：
- 作为WebSocket的备份机制
- 使用合适的轮询间隔
- 正确处理环境差异
- 确保资源的及时清理

[Previous content remains unchanged...]
