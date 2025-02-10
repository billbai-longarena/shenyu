import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/chat/ChatView.vue'
import SN43View from '../views/sn43/SN43View.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/chat'
        },
        {
            path: '/chat',
            name: 'chat',
            component: ChatView,
            meta: {
                storageKey: 'chat-history'
            }
        },
        {
            path: '/sn43',
            name: 'sn43',
            component: SN43View,
            meta: {
                title: 'SN4+3',
                storageKey: 'sn43-history'
            }
        }
    ]
})

// 路由守卫：在路由切换时处理历史记录
router.beforeEach((to, from, next) => {
    // 如果是切换到不同的页面（不同的storageKey）
    if (to.meta.storageKey !== from.meta.storageKey) {
        // 清理当前历史记录状态
        // 注意：实际的清理和加载会在组件的onMounted中进行
        console.log(`[Router] Switching history storage: ${from.meta.storageKey} -> ${to.meta.storageKey}`);
    }
    next();
})

export default router
