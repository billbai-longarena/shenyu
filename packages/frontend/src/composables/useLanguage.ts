import { ref, computed, provide, reactive, readonly, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { LocaleMessages } from '../locales/types'
import { messages as enMessages } from '../locales/en'
import { messages as zhMessages } from '../locales/zh'
import { useHistory } from './useHistory'

interface LanguageConfig {
    defaultLanguage: 'en' | 'zh'
}

// 创建全局的语言状态
const globalLanguageState = reactive({
    current: 'en' as 'en' | 'zh'
})

export function useLanguage() {
    // 提供只读的语言状态
    provide('languageState', readonly(globalLanguageState))

    // 当前语言的所有文本
    const messages = computed<LocaleMessages>(() =>
        globalLanguageState.current === 'en' ? enMessages : zhMessages
    )

    // 导出当前语言的ref，保持向后兼容
    const currentLanguage = computed({
        get: () => globalLanguageState.current,
        set: (value) => { globalLanguageState.current = value }
    })

    // 添加调试日志
    watch(() => globalLanguageState.current, (newLang, oldLang) => {
        console.log('[useLanguage] 全局语言状态变化', {
            旧语言: oldLang,
            新语言: newLang
        })
    })

    // 获取特定文本的辅助函数
    const t = (path: string) => {
        const keys = path.split('.')
        let result: any = messages.value
        for (const key of keys) {
            result = result[key]
        }
        return result
    }

    // 加载默认语言
    const loadDefaultLanguage = async () => {
        console.log('\n[useLanguage] ====== 开始加载默认语言配置 ======')
        console.log('[useLanguage] 环境信息:', {
            MODE: import.meta.env.MODE,
            BASE_URL: import.meta.env.BASE_URL,
            DEV: import.meta.env.DEV,
            PROD: import.meta.env.PROD
        })

        try {
            const url = '/language-config.json'
            console.log('[useLanguage] 请求URL:', url)

            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            })

            console.log('[useLanguage] 响应状态:', response.status)
            console.log('[useLanguage] 响应头:', Object.fromEntries(response.headers.entries()))

            if (!response.ok) {
                throw new Error(`加载默认语言配置失败: HTTP ${response.status}`)
            }

            const data = await response.json() as LanguageConfig
            console.log('[useLanguage] 加载的配置:', data)
            globalLanguageState.current = data.defaultLanguage
            return data
        } catch (error) {
            console.error('[useLanguage] 读取默认语言配置失败:', error)
            if (error instanceof Error) {
                console.error('[useLanguage] 错误堆栈:', error.stack)
            }
            ElMessage.error('读取默认语言配置失败')
            return null
        }
    }

    // 保存默认语言
    const saveDefaultLanguage = async (lang: 'en' | 'zh'): Promise<boolean> => {
        console.log('[useLanguage] 开始保存语言配置')
        try {
            const config: LanguageConfig = {
                defaultLanguage: lang
            }

            console.log('[useLanguage] 准备保存的配置:', config)
            console.log('[useLanguage] 请求URL: /api/language-config/save')

            const response = await fetch('/api/language-config/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            })

            if (!response.ok) {
                const responseText = await response.text()
                let errorMessage = '保存默认语言配置失败'
                try {
                    const responseData = JSON.parse(responseText)
                    if (responseData.error?.message) {
                        errorMessage = responseData.error.message
                    }
                } catch (e) {
                    errorMessage = responseText
                }
                throw new Error(errorMessage)
            }

            // 先更新语言值，这样可以使用新语言显示消息
            globalLanguageState.current = lang
            ElMessage.success(t('language.switchSuccess'))
            return true
        } catch (error) {
            console.error('[useLanguage] 保存默认语言配置失败:', error)
            if (error instanceof Error) {
                console.error('[useLanguage] 错误堆栈:', error.stack)
            }
            ElMessage.error('保存默认语言配置失败')
            return false
        }
    }

    // 切换语言
    const toggleLanguage = async () => {
        const newLang = currentLanguage.value === 'en' ? 'zh' : 'en'
        console.log('[useLanguage] 开始切换语言，当前语言:', currentLanguage.value, '新语言:', newLang)
        try {
            // 先保存语言配置
            const success = await saveDefaultLanguage(newLang)
            if (!success) {
                throw new Error('保存语言配置失败')
            }

            // 保存成功后更新语言值
            console.log('[useLanguage] 语言配置保存成功，更新语言值为:', newLang)
            globalLanguageState.current = newLang

            // 触发语言变化和新对话事件
            console.log('[useLanguage] 触发语言变化事件')
            window.dispatchEvent(new CustomEvent('language-changed', {
                detail: {
                    lang: newLang,
                    shouldStartNewChat: true
                }
            }))
        } catch (error) {
            console.error('[useLanguage] 切换语言失败:', error)
            ElMessage.error('切换语言失败')
        }
    }

    return {
        currentLanguage,
        messages,
        t,
        loadDefaultLanguage,
        saveDefaultLanguage,
        toggleLanguage
    }
}
