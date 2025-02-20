import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useLanguage } from './useLanguage'
import { useStreamResponse } from './useStreamResponse'
import { setTemperature } from '../api/api-deepseekStream'

interface ImportConfigResult {
    success: boolean
    message?: string
}

interface ImportConfig {
    (config: any): Promise<ImportConfigResult>
}

export function useAgentActions(
    props: any,
    emit: any,
    importConfig: ImportConfig
) {
    const { t } = useLanguage()
    const { handleStreamResponse } = useStreamResponse()
    const isGenerating = ref(false)
    const textareaGenerateAgent = ref('')
    const pathInput = ref('')

    // 清理JSON字符串中的控制字符
    const cleanJsonString = (str: string) => {
        return str
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\n\s*\n/g, '\n')
            .trim()
    }

    // 生成AI智能体
    const generateAIAgent = async () => {
        if (!textareaGenerateAgent.value.trim()) {
            ElMessage.warning(t('configPanel.agentInputPlaceholder'))
            return
        }

        isGenerating.value = true
        try {
            setTemperature(0)

            const prompts: string[] = []
            let i = 1
            while (true) {
                const key = `configPanel.agentPromptTemplate${i}`
                const template = t(key)
                if (!template || template === key) {
                    break
                }
                prompts.push(template.replace('${input}', textareaGenerateAgent.value))
                i++
            }

            emit('update:adminInputs', {})
            emit('update:promptBlocks', [])
            emit('update:inputCounter', 0)

            pathInput.value = ''

            const promptResults: string[] = []

            for (let i = 0; i < prompts.length; i++) {
                let currentPrompt = prompts[i]

                for (let j = 0; j < promptResults.length; j++) {
                    currentPrompt = currentPrompt.replace(
                        `\${promptResults${j + 1}}`,
                        promptResults[j]
                    )
                }

                const isLastPrompt = i === prompts.length - 1

                if (isLastPrompt) {
                    await handleStreamResponse(
                        currentPrompt,
                        async (chunk: string, processedChunk: string) => {
                            if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
                                pathInput.value += processedChunk
                            }
                        }
                    )
                } else {
                    const response = await handleStreamResponse(currentPrompt)
                    promptResults.push(response.content)
                }
            }

            await generateFromText()
        } catch (error) {
            console.error('生成AI智能体失败:', error)
            ElMessage.error(t('configPanel.generateAgentError'))
        } finally {
            isGenerating.value = false
        }
    }

    // 从文本生成控件
    const generateFromText = async () => {
        const input = pathInput.value
        try {
            const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g
            const matches = input.match(jsonRegex)

            if (!matches || matches.length === 0) {
                ElMessage.warning(t('configPanel.noValidJsonFound'))
                return
            }

            const cleanedJson = cleanJsonString(matches[0])
            const config = JSON.parse(cleanedJson)

            if (config.adminInputs) {
                Object.keys(config.adminInputs).forEach(key => {
                    const value = config.adminInputs[key]
                    config.adminInputs[key] = value.replace(/<def>(.*?)<def>/g, '<def>$1</def>')
                })
            }

            let configToImport = config

            // 检查是否是旧格式（直接包含adminInputs和promptBlocks）
            if (config.adminInputs && config.promptBlocks && !config.currentVersion) {
                // 将 promptBlocks 对象转换为数组格式
                const promptBlocksArray = Object.values(config.promptBlocks).map((text: any) => ({
                    text: typeof text === 'string' ? text : text.text
                }))

                // 转换为新格式
                configToImport = {
                    currentVersion: {
                        adminInputs: config.adminInputs,
                        promptBlocks: promptBlocksArray
                    },
                    versionHistory: [{
                        version: Date.now().toString(),
                        description: '导入旧版本配置',
                        timestamp: new Date().toISOString(),
                        adminInputs: config.adminInputs,
                        promptBlocks: promptBlocksArray
                    }]
                }
            }

            const result = await importConfig(configToImport)
            if (result.success) {
                emit('config-modified')
                ElMessage.success(t('configPanel.controlsGenerated'))
            } else {
                ElMessage.error(result.message)
            }
        } catch (error) {
            console.error('生成控件失败:', error)
            ElMessage.error(t('configPanel.generateError'))
        }
    }

    return {
        isGenerating,
        textareaGenerateAgent,
        pathInput,
        generateAIAgent,
        generateFromText
    }
}
