import { ref, computed } from 'vue'

interface Props {
    initialAgentWidth?: number
    initialConfigWidth?: number
    minWidth?: number
    maxWidth?: number
}

export function useLayoutActions(props: Props = {}) {
    const {
        initialAgentWidth = 23,
        initialConfigWidth = 33,
        minWidth = 20,
        maxWidth = 60
    } = props

    // 区域宽度
    const agentWidth = ref(initialAgentWidth)
    const configWidth = ref(initialConfigWidth)
    const promptWidth = computed(() => 100 - agentWidth.value - configWidth.value)

    // 拖动相关的状态
    const isResizing = ref(false)
    const startX = ref(0)
    const startWidth = ref(0)
    const currentResizeTarget = ref<'agent' | 'config' | null>(null)

    // 开始拖动Agent区域
    const startResizeAgent = (e: MouseEvent) => {
        isResizing.value = true
        startX.value = e.clientX
        startWidth.value = agentWidth.value
        currentResizeTarget.value = 'agent'
        document.addEventListener('mousemove', handleResize)
        document.addEventListener('mouseup', stopResize)
        document.body.classList.add('resizing')
    }

    // 开始拖动Config区域
    const startResizeConfig = (e: MouseEvent) => {
        isResizing.value = true
        startX.value = e.clientX
        startWidth.value = configWidth.value
        currentResizeTarget.value = 'config'
        document.addEventListener('mousemove', handleResize)
        document.addEventListener('mouseup', stopResize)
        document.body.classList.add('resizing')
    }

    // 处理拖动
    const handleResize = (e: MouseEvent) => {
        if (!isResizing.value || !currentResizeTarget.value) return

        const container = document.querySelector('.admin-interface-container')
        if (!container) return

        const dx = e.clientX - startX.value
        const containerWidth = container.getBoundingClientRect().width
        const newWidthPercent = startWidth.value + (dx / containerWidth * 100)

        const limitedWidth = Math.min(Math.max(newWidthPercent, minWidth), maxWidth)

        if (currentResizeTarget.value === 'agent') {
            const maxWidth = 100 - configWidth.value - 20
            agentWidth.value = Math.min(limitedWidth, maxWidth)
        } else {
            const maxWidth = 100 - agentWidth.value - 20
            configWidth.value = Math.min(limitedWidth, maxWidth)
        }
    }

    // 停止拖动
    const stopResize = () => {
        isResizing.value = false
        currentResizeTarget.value = null
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', stopResize)
        document.body.classList.remove('resizing')
    }

    // 双击重置宽度
    const resetWidths = () => {
        agentWidth.value = initialAgentWidth
        configWidth.value = initialConfigWidth
    }

    // 组件卸载时清理事件监听
    const cleanup = () => {
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', stopResize)
        document.body.classList.remove('resizing')
    }

    return {
        // 宽度状态
        agentWidth,
        configWidth,
        promptWidth,

        // 拖动处理函数
        startResizeAgent,
        startResizeConfig,
        resetWidths,

        // 清理函数
        cleanup
    }
}
