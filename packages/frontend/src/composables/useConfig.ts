import { ElMessage } from 'element-plus'

interface ConfigProps {
    adminInputs: { [key: string]: string }
    userInputs: { [key: string]: string }
    promptBlocks: { text: string }[]
    inputCounter: number
}

interface ConfigEmits {
    (e: 'update:adminInputs', value: { [key: string]: string }): void
    (e: 'update:userInputs', value: { [key: string]: string }): void
    (e: 'update:promptBlocks', value: { text: string }[]): void
    (e: 'update:inputCounter', value: number): void
}

export function useConfig(props: ConfigProps, emit: ConfigEmits) {
    // 导出配置到JSON文件
    const exportConfig = () => {
        const config = {
            adminInputs: props.adminInputs,
            promptBlocks: props.promptBlocks.map(block => block.text)
        }

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = 'sn43-config.json'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    // 导入配置
    const importConfig = (config: any) => {
        try {
            // 清空现有配置
            emit('update:adminInputs', {})
            emit('update:promptBlocks', [])

            // 导入新配置
            if (config.adminInputs) {
                emit('update:adminInputs', config.adminInputs)

                // 同步创建用户输入框
                const newUserInputs: { [key: string]: string } = {}
                Object.keys(config.adminInputs).forEach(key => {
                    const num = key.replace('inputB', '')
                    const userKey = `inputA${num}`
                    newUserInputs[userKey] = ''
                })
                emit('update:userInputs', newUserInputs)

                // 更新计数器
                const maxNumber = Math.max(
                    ...Object.keys(config.adminInputs)
                        .map(key => parseInt(key.replace('inputB', '')))
                        .filter(num => !isNaN(num)),
                    0
                )
                emit('update:inputCounter', maxNumber)
            }

            if (config.promptBlocks) {
                emit('update:promptBlocks', config.promptBlocks.map((text: string) => ({ text })))
            }

            ElMessage.success('配置导入成功')
        } catch (error) {
            console.error('导入配置失败:', error)
            ElMessage.error('配置文件格式错误')
        }
    }

    // 恢复默认配置
    const resetConfig = async () => {
        try {
            const response = await fetch('/SN4+3案例和SJT.json', {
                headers: {
                    'Cache-Control': 'no-cache'  // 防止缓存
                }
            })
            if (!response.ok) {
                throw new Error('加载默认配置失败')
            }

            const config = await response.json()
            importConfig(config)

            ElMessage.success('已恢复默认配置')
        } catch (error) {
            console.error('恢复默认配置失败:', error)
            ElMessage.error('加载默认配置失败')
        }
    }

    return {
        exportConfig,
        importConfig,
        resetConfig
    }
}
