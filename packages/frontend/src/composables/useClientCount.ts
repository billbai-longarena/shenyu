import { ref } from 'vue'

const clientCount = ref<number | null>(null)
let ws: WebSocket | null = null

export function useClientCount() {
  // 更新客户端计数的函数
  function updateClientCount(count: number) {
    if (count !== clientCount.value) {
      clientCount.value = count
    }
  }

  // 获取客户端连接数的函数（作为备份机制）
  async function fetchClientCount() {
    try {
      const port = import.meta.env.PROD ? '' : ':3001'
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}${port}/api/client-count`)
      const data = await response.json()
      if (data.count !== undefined) {
        updateClientCount(data.count)
      }
    } catch (error) {
      console.error('获取客户端数量失败:', error)
    }
  }

  // 初始化WebSocket连接
  function initWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return ws
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const port = import.meta.env.PROD ? '' : ':3001'
    const wsUrl = `${protocol}//${window.location.hostname}${port}/websocket`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WebSocket] 连接已建立，请求客户端数量')
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'getClientCount' }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data)
        if (response.type === 'connectionCount') {
          updateClientCount(response.count)
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }

    ws.onclose = () => {
      console.log('[WebSocket] 连接已关闭')
      ws = null
    }

    return ws
  }

  // 关闭WebSocket连接
  function closeWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  }

  return {
    clientCount,
    updateClientCount,
    fetchClientCount,
    initWebSocket,
    closeWebSocket
  }
}
