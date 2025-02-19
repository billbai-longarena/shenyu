import { ref } from 'vue'
import { useLanguage } from './useLanguage'

export interface VersionInfo {
    version: string
    description: string
    timestamp: string
    adminInputs: { [key: string]: string }
    promptBlocks: { text: string }[]
}

export interface ConfigFile {
    currentVersion: {
        adminInputs: { [key: string]: string }
        promptBlocks: { text: string }[]
    }
    versionHistory: VersionInfo[]
}

interface Props {
    adminInputs: { [key: string]: string }
    promptBlocks: { text: string }[]
}

interface Emits {
    (e: 'update:adminInputs', value: { [key: string]: string }): void
    (e: 'update:promptBlocks', value: { text: string }[]): void
    (e: 'config-modified'): void
}

export const useVersionConfig = (props: Props, emit: Emits) => {
    const { t } = useLanguage()
    const versionDescription = ref('')
    const versionHistory = ref<VersionInfo[]>([])
    const currentVersionIndex = ref<number | null>(null)

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
            // 检查是否是新版本格式
            if ('currentVersion' in config && 'versionHistory' in config) {
                // 加载当前版本
                emit('update:adminInputs', { ...config.currentVersion.adminInputs })
                emit('update:promptBlocks', [...config.currentVersion.promptBlocks])

                // 更新版本历史
                versionHistory.value = config.versionHistory
                currentVersionIndex.value = 0
            } else {
                // 兼容旧版本格式
                const promptBlocksArray = Array.isArray(config.promptBlocks)
                    ? config.promptBlocks
                    : Object.values(config.promptBlocks || {}).map((text: any) => ({ text }));

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
