import { ref, inject, computed, type Ref, type ComputedRef } from 'vue'
import { useLanguage } from './useLanguage'
import type { ModelType } from '../api/api-deepseekStream'

export interface VersionInfo {
    version: string
    description: string
    timestamp: string
    adminInputs: { [key: string]: string }
    promptBlocks: {
        text: string
        model?: ModelType | 'inherit'
        temperature?: number | 'inherit'
    }[]
}

export interface ConfigFile {
    currentVersion: {
        adminInputs: { [key: string]: string }
        promptBlocks: {
            text: string
            model?: ModelType | 'inherit'
            temperature?: number | 'inherit'
        }[]
    }
    versionHistory: VersionInfo[]
}

interface Props {
    adminInputs: { [key: string]: string }
    promptBlocks: {
        text: string
        model?: ModelType | 'inherit'
        temperature?: number | 'inherit'
    }[]
}

interface Emits {
    (e: 'update:adminInputs', value: { [key: string]: string }): void
    (e: 'update:promptBlocks', value: {
        text: string
        model?: ModelType | 'inherit'
        temperature?: number | 'inherit'
    }[]): void
    (e: 'config-modified'): void
}

export const useVersionConfig = (props: Props, emit: Emits) => {
    const { t } = useLanguage()
    const versionDescription = ref('')
    const versionHistory = ref<VersionInfo[]>([])
    const currentVersionIndex = ref<number | null>(null)

    interface ModelOption {
        label: string
        value: ModelType
        speed?: {
            responseTime?: number
            status: 'none' | 'fast' | 'medium' | 'slow' | 'error'
        }
    }

    interface TemperatureOption {
        label: string
        value: number
    }

    // 在setup中获取注入的值
    const modelOptions = inject<Ref<ModelOption[]>>('modelOptions', ref([]))
    const temperatureOptions = inject<ComputedRef<TemperatureOption[]>>('temperatureOptions', computed(() => []))

    // 格式化时间戳
    const formatTimestamp = (timestamp: string) => {
        const locale = t('language.code') === 'en' ? 'en-US' : 'zh-CN'
        return new Date(timestamp).toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // 加载指定版本
    const loadVersion = (index: number) => {
        const version = versionHistory.value[index]
        if (!version) return

        emit('update:adminInputs', { ...version.adminInputs })
        emit('update:promptBlocks', [...version.promptBlocks])
        currentVersionIndex.value = index
    }

    // 导出配置
    const exportConfig = async () => {
        if (!versionDescription.value.trim()) {
            return { success: false, message: t('configPanel.versionManagement.versionDescriptionRequired') }
        }

        const newVersion: VersionInfo = {
            version: Date.now().toString(),
            description: versionDescription.value,
            timestamp: new Date().toISOString(),
            adminInputs: { ...props.adminInputs },
            promptBlocks: [...props.promptBlocks]
        }

        // 添加到版本历史
        versionHistory.value = [newVersion, ...versionHistory.value]
        currentVersionIndex.value = 0

        // 创建配置文件对象
        const config: ConfigFile = {
            currentVersion: {
                adminInputs: { ...props.adminInputs },
                promptBlocks: [...props.promptBlocks]
            },
            versionHistory: versionHistory.value
        }

        // 创建Blob并下载
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `config_${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        versionDescription.value = ''
        return { success: true, message: t('configPanel.versionManagement.exportSuccess') }
    }

    // 导入配置
    const importConfig = async (config: any) => {
        try {
            // 验证和转换promptBlock
            const validateAndTransformBlock = (block: any) => {
                const validModels = modelOptions.value.map((option: ModelOption) => option.value)
                const validTemperatures = temperatureOptions.value.map((option: TemperatureOption) => option.value)

                const text = typeof block === 'string' ? block : block.text
                let model = block.model || 'inherit'
                let temperature = block.temperature || 'inherit'

                // 验证model是否在有效列表中
                if (model !== 'inherit' && !validModels.includes(model)) {
                    console.log(`导入的model值 "${model}" 不在有效列表中，设置为inherit`)
                    model = 'inherit'
                }

                // 验证temperature是否为有效值
                if (temperature !== 'inherit' && !validTemperatures.includes(temperature)) {
                    console.log(`导入的temperature值 "${temperature}" 不在有效范围内，设置为inherit`)
                    temperature = 'inherit'
                }

                return { text, model, temperature }
            }

            // 检查是否是新版本格式
            if ('currentVersion' in config && 'versionHistory' in config) {
                // 验证并转换当前版本的promptBlocks
                const validatedPromptBlocks = config.currentVersion.promptBlocks.map(validateAndTransformBlock)
                emit('update:adminInputs', { ...config.currentVersion.adminInputs })
                emit('update:promptBlocks', validatedPromptBlocks)

                // 验证并转换版本历史中的promptBlocks
                const validatedHistory = config.versionHistory.map((version: VersionInfo) => ({
                    ...version,
                    promptBlocks: version.promptBlocks.map(validateAndTransformBlock)
                }))
                versionHistory.value = validatedHistory
                currentVersionIndex.value = 0
            } else {
                // 兼容旧版本格式
                const promptBlocksArray = Array.isArray(config.promptBlocks)
                    ? config.promptBlocks.map(validateAndTransformBlock)
                    : Object.values(config.promptBlocks || {}).map((text: any) => validateAndTransformBlock({
                        text: typeof text === 'string' ? text : text.text,
                        model: 'inherit',
                        temperature: 'inherit'
                    }));

                emit('update:adminInputs', { ...config.adminInputs })
                emit('update:promptBlocks', promptBlocksArray)

                // 创建初始版本
                const initialVersion: VersionInfo = {
                    version: Date.now().toString(),
                    description: t('configPanel.versionManagement.initialImport'),
                    timestamp: new Date().toISOString(),
                    adminInputs: { ...config.adminInputs },
                    promptBlocks: promptBlocksArray
                }
                versionHistory.value = [initialVersion]
                currentVersionIndex.value = 0
            }

            emit('config-modified')
            return { success: true, message: t('configPanel.versionManagement.importSuccess') }
        } catch (error) {
            console.error('导入配置失败:', error)
            return { success: false, message: t('configPanel.versionManagement.importError') + ': ' + (error as Error).message }
        }
    }

    return {
        versionDescription,
        versionHistory,
        currentVersionIndex,
        formatTimestamp,
        loadVersion,
        exportConfig,
        importConfig
    }
}
