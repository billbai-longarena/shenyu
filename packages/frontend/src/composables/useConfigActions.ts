import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLanguage } from './useLanguage'

interface Props {
    adminInputs: { [key: string]: string }
    userInputs: { [key: string]: string }
    inputCounter: number
}

interface ImportConfigResult {
    success: boolean
    message?: string
}

interface ExportConfigResult {
    success: boolean
    message?: string
}

interface VersionConfig {
    exportConfig: () => Promise<ExportConfigResult>
    importConfig: (config: any) => Promise<ImportConfigResult>
    versionDescription: any
}

interface PromptActions {
    insertPlaceholder: (key: string) => void
}

export function useConfigActions(
    props: Props,
    emit: any,
    versionConfig: VersionConfig,
    promptActions?: PromptActions
) {
    const { t } = useLanguage()
    const fileInput = ref<HTMLInputElement | null>(null)

    // 清理JSON字符串中的控制字符
    const cleanJsonString = (str: string) => {
        return str
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\n\s*\n/g, '\n')
            .trim()
    }

    // 处理文件上传
    const handleFileUpload = async (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const jsonStr = cleanJsonString(e.target?.result as string)
                const config = JSON.parse(jsonStr)
                const result = await versionConfig.importConfig(config)

                if (result.success) {
                    ElMessage.success(result.message)
                } else {
                    ElMessage.error(result.message)
                }
            } catch (error) {
                console.error('导入配置失败:', error)
                ElMessage.error(t('configPanel.importError'))
            }

            if (fileInput.value) {
                fileInput.value.value = ''
            }
        }
        reader.readAsText(file)
    }

    // 处理导出配置
    const handleExportConfig = async () => {
        // 如果版本描述为空，自动生成一个包含日期的版本描述
        if (!versionConfig.versionDescription.value.trim()) {
            const now = new Date()
            const year = now.getFullYear()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            versionConfig.versionDescription.value = `配置_${year}${month}${day}`
        }

        const result = await versionConfig.exportConfig()
        if (result.success) {
            ElMessage.success(result.message)
        } else {
            ElMessage.warning(result.message)
        }
    }

    // 添加用户输入
    const addUserInput = () => {
        const newCounter = props.inputCounter + 1
        emit('update:inputCounter', newCounter)

        const adminKey = `inputB${newCounter}`
        const newAdminInputs = { ...props.adminInputs }
        newAdminInputs[adminKey] = ''
        emit('update:adminInputs', newAdminInputs)

        const userKey = `inputA${newCounter}`
        const newUserInputs = { ...props.userInputs }
        newUserInputs[userKey] = ''
        emit('update:userInputs', newUserInputs)

        emit('config-modified')
    }

    // 删除管理员输入框
    const deleteAdminInput = async (key: string) => {
        try {
            await ElMessageBox.confirm(
                t('configPanel.deleteInputConfirm'),
                t('configPanel.deleteConfirm'),
                {
                    confirmButtonText: t('configPanel.confirm'),
                    cancelButtonText: t('configPanel.cancel'),
                    type: 'warning'
                }
            )

            const newAdminInputs = Object.fromEntries(
                Object.entries(props.adminInputs).filter(([k]) => k !== key)
            )
            emit('update:adminInputs', newAdminInputs)

            const userKey = `inputA${key.replace('inputB', '')}`
            const newUserInputs = Object.fromEntries(
                Object.entries(props.userInputs).filter(([k]) => k !== userKey)
            )
            emit('update:userInputs', newUserInputs)

            emit('config-modified')

            ElMessage.success(t('configPanel.deleteSuccess'))
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除输入框时发生错误:', error)
                ElMessage.error(t('configPanel.deleteError') + (error as Error).message)
            }
        }
    }

    // 处理管理员输入
    const handleAdminInput = (key: string, value: string) => {
        const match = value.match(/<def>(.*?)<\/def>/)
        if (match) {
            const userKey = `inputA${key.replace('inputB', '')}`
            const defaultValue = match[1]
            const newUserInputs = { ...props.userInputs }
            newUserInputs[userKey] = defaultValue
            emit('update:userInputs', newUserInputs)
        }
        emit('config-modified')
    }

    // 处理管理员输入插入
    const handleAdminInputInsert = (key: string) => {
        if (promptActions?.insertPlaceholder) {
            promptActions.insertPlaceholder(key)
        }
    }

    return {
        fileInput,
        handleFileUpload,
        handleExportConfig,
        addUserInput,
        deleteAdminInput,
        handleAdminInput,
        handleAdminInputInsert
    }
}
