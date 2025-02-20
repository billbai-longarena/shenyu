import { ref } from 'vue'
import { marked } from 'marked'
import { RequestAI, getCurrentModel } from '../api/api-deepseekStream'
import type { Message } from '../types/chat'
import type { ModelType } from '../api/api-deepseekStream'

// 配置marked选项
marked.setOptions({
    breaks: true,    // 支持GitHub风格的换行符
    gfm: true,       // 启用GitHub风格的Markdown
    pedantic: false  // 不要过分严格
})

export interface StreamConfig {
    // 是否将响应内容转换为 Markdown
    enableMarkdown?: boolean
    // 自定义的内容处理函数
    contentProcessor?: (content: string) => string | Promise<string>
    // 错误处理函数
    onError?: (error: Error) => void
    // 模型选择
    model?: ModelType
    // 温度设置
    temperature?: number
}

export interface StreamResponse {
    // 完整的响应内容
    content: string
    // 转换后的消息数组
    messages: Message[]
}

export function useStreamResponse() {
    const isStreaming = ref(false)

    /**
     * 处理数据块
     * @param chunk 原始数据块
     * @param contentProcessor 内容处理函数
     */
    const processChunk = async (
        chunk: string,
        contentProcessor?: (content: string) => string | Promise<string>
    ): Promise<string> => {
        console.log('[Process Chunk Input]:', JSON.stringify(chunk))
        let processed = chunk
        try {
            if (contentProcessor) {
                processed = await Promise.resolve(contentProcessor(processed))
                console.log('[After Content Processor]:', JSON.stringify(processed))
            }
            return processed
        } catch (error) {
            console.error('处理内容时发生错误:', error)
            return chunk
        }
    }

    /**
     * 处理AI流式响应
     * @param prompt AI提示词
     * @param onChunkUpdate 每个数据块的更新回调
     * @param config 配置选项
     */
    const handleStreamResponse = async (
        prompt: string,
        onChunkUpdate?: (chunk: string, processedChunk: string) => void | Promise<void>,
        config: StreamConfig = {}
    ): Promise<StreamResponse> => {
        const {
            contentProcessor,
            onError,
            model,
            temperature
        } = config

        try {
            isStreaming.value = true
            let fullContent = ''

            await RequestAI(
                model || getCurrentModel(),
                prompt,
                async (chunk: string) => {
                    const isDone = chunk.includes('[DONE]')
                    const isError = chunk.includes('[ERROR]')

                    if (!isDone && !isError) {
                        // 只有非控制消息才添加到内容中
                        fullContent += chunk
                        const processedChunk = await processChunk(chunk, contentProcessor)
                        if (onChunkUpdate) {
                            await onChunkUpdate(chunk, processedChunk)
                        }
                    } else if (isDone || isError) {
                        // 控制消息只传给回调，不添加到内容中
                        if (onChunkUpdate) {
                            await onChunkUpdate(chunk, '')
                        }
                    }
                },
                undefined,
                temperature
            )

            return {
                content: fullContent,
                messages: [
                    { role: 'user' as const, content: prompt },
                    ...(fullContent ? [{ role: 'assistant' as const, content: fullContent }] : [])
                ]
            }

        } catch (error: any) {
            console.error('Stream response error:', error)
            if (onError) {
                onError(error)
            }
            throw error
        } finally {
            isStreaming.value = false
        }
    }

    /**
     * 批量处理多个提示词，支持并发执行
     * @param prompts 提示词数组
     * @param onBlockUpdate 每个块的更新回调
     * @param config 配置选项
     */
    const handleMultipleStreams = async (
        prompts: string[],
        onBlockUpdate?: (blockIndex: number, chunk: string, processedChunk: string) => void | Promise<void>,
        config: StreamConfig = {}
    ): Promise<StreamResponse[]> => {
        const responses: (StreamResponse | null)[] = new Array(prompts.length).fill(null)
        const requestQueue = (await import('../services/requestQueue')).RequestQueue.getInstance()

        // 设置并发数为4
        requestQueue.setMaxConcurrent(4);

        // 使用队列处理所有请求
        const promises = prompts.map(async (prompt, index) => {
            try {
                let fullContent = '';
                await requestQueue.enqueue(
                    prompt,
                    async (chunk: string) => {
                        const isDone = chunk.includes('[DONE]')
                        const isError = chunk.includes('[ERROR]')

                        if (!isDone && !isError) {
                            fullContent += chunk
                            const processedChunk = await processChunk(chunk, config.contentProcessor)
                            if (onBlockUpdate) {
                                await onBlockUpdate(index, chunk, processedChunk)
                            }
                        } else if (isDone || isError) {
                            // 控制消息只传给回调，不添加到内容中
                            if (onBlockUpdate) {
                                await onBlockUpdate(index, chunk, '')
                            }
                        }
                    },
                    index,
                    'speed_test'
                );

                const response = {
                    content: fullContent,
                    messages: [
                        { role: 'user' as const, content: prompt },
                        ...(fullContent ? [{ role: 'assistant' as const, content: fullContent }] : [])
                    ]
                };
                responses[index] = response;
                return response;
            } catch (error) {
                console.error(`Failed to process stream ${index}:`, error)
                responses[index] = {
                    content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    messages: [
                        { role: 'user' as const, content: prompt },
                        { role: 'assistant' as const, content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
                    ]
                }
                throw error
            }
        });

        // 等待所有请求完成
        await Promise.allSettled(promises);

        // 过滤掉null值并返回结果
        return responses.filter((r): r is StreamResponse => r !== null)
    }

    return {
        isStreaming,
        handleStreamResponse,
        handleMultipleStreams
    }
}
