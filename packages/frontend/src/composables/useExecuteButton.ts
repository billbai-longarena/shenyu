import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { marked } from 'marked'
import { useStreamResponse } from './useStreamResponse'
import type { Message } from '../types/chat'
import { getCurrentModel, getCurrentTemperature } from '../api/api-deepseekStream'
import type { ModelType } from '../api/api-deepseekStream'
import { ExecuteButtonQueue } from '../services/executeButton.queue.js'
import { BlockManager } from '../services/blockManager'

interface PromptBlock {
    text: string
    model?: string | 'inherit'
    temperature?: number | 'inherit'
}

// 状态同步验证函数
const validateBlockStatus = (
    blockManager: BlockManager | null,
    blockIndex: number,
    blockStatuses: any
) => {
    if (!blockManager) return;

    const block = blockManager.getBlock(blockIndex);
    const status = blockStatuses[blockIndex];

    if (block?.status !== status.status) {
        console.warn(`Block ${blockIndex} status mismatch:`, {
            blockManagerStatus: block?.status,
            reactiveStatus: status.status
        });
        // 同步状态
        blockStatuses[blockIndex].status = block?.status || 'error';
        if (block?.error) {
            blockStatuses[blockIndex].error = block.error;
        }
    }
}

export function useExecuteButton() {
    const { handleStreamResponse } = useStreamResponse()
    const isExecuting = ref(false)
    const currentBlockIndex = ref(0)
    const isParallelMode = ref(false)
    const completedParallelBlocks = ref(0)
    const totalParallelBlocks = ref(0)
    const isAllBlocksCompleted = ref(false)
    const blockStatuses = ref<{ status: 'pending' | 'streaming' | 'completed' | 'error', error?: string }[]>([])
    const blockContents = ref<string[]>([])

    // block管理器
    let blockManager: BlockManager | null = null

    // 替换基础占位符（inputB和inputpdfB）
    const replaceBasicPlaceholders = async (text: string, userInputs: { [key: string]: string }): Promise<string> => {
        let result = text.replace(/\${(inputB|inputpdfB)(\d+)}/g, (match, type, num) => {
            const userKey = `input${type === 'inputB' ? 'A' : 'pdfA'}${num}`
            return userInputs[userKey] || match
        })
        return result
    }

    // 替换所有占位符（包括promptBlock、inputB和inputpdfB）
    const replaceAllPlaceholders = async (text: string, userInputs: { [key: string]: string }, promptBlocks: PromptBlock[]): Promise<string> => {
        console.log('开始替换占位符:', text)

        let result = await replaceBasicPlaceholders(text, userInputs)
        console.log('替换基础占位符后:', result)

        const matches: { index: number, match: string }[] = []
        const promptBlockRegex = /\${promptBlock(\d+)}/g
        let match
        while ((match = promptBlockRegex.exec(result)) !== null) {
            const blockIndex = parseInt(match[1]) - 1
            if (blockIndex >= 0 && blockIndex < promptBlocks.length) {
                matches.push({ index: blockIndex, match: match[0] })
            }
        }

        if (matches.length > 0) {
            const processPromises = matches.map(async ({ index, match }) => {
                const block = blockManager?.getBlock(index);
                if (block && block.content) {
                    console.log(`使用缓存的结果 [Block ${index}]:`, block.content)
                    return { match, content: block.content }
                }

                console.log(`需要处理新的Block [${index}]`)
                const blockText = promptBlocks[index].text
                if (blockText) {
                    try {
                        const processedText = await replaceAllPlaceholders(blockText, userInputs, promptBlocks)
                        console.log(`处理Block ${index}的结果:`, processedText)

                        const response = await handleStreamResponse(
                            processedText,
                            async (chunk: string, processedChunk: string) => {
                                blockManager?.updateBlockContent(index, processedChunk);
                            },
                            {
                                onError: (error: Error) => {
                                    console.error('处理提示词块时发生错误:', error)
                                    blockManager?.errorBlock(index, error.message);
                                },
                                model: promptBlocks[index].model === 'inherit' || !promptBlocks[index].model ? getCurrentModel() : promptBlocks[index].model as ModelType,
                                temperature: promptBlocks[index].temperature === 'inherit' || promptBlocks[index].temperature === undefined ? getCurrentTemperature() : promptBlocks[index].temperature as number
                            }
                        )

                        blockManager?.updateBlockContent(index, response.content);
                        blockManager?.completeBlock(index);
                        console.log(`将结果存入缓存 [Block ${index}]:`, response.content)
                        return { match, content: response.content }
                    } catch (error: any) {
                        console.error('处理提示词块占位符时发生错误:', error)
                        const errorContent = `[错误: ${error.message || '未知错误'}]`
                        blockManager?.errorBlock(index, errorContent);
                        return { match, content: errorContent }
                    }
                }
                return { match, content: match }
            })

            const results = await Promise.all(processPromises)
            results.forEach(({ match, content }) => {
                result = result.replace(match, content)
            })
        }

        console.log('替换所有占位符后:', result)
        return result
    }

    // 执行用户输入
    const executeUserInputs = async (
        userInputs: { [key: string]: string },
        adminInputs: { [key: string]: string },
        promptBlocks: PromptBlock[],
        onChunkUpdate?: (blockIndex: number, chunk: string) => void
    ) => {
        if (promptBlocks.length === 0) {
            throw new Error('请先添加提示词块')
        }

        if (blockManager?.isCurrentlyExecuting()) {
            console.log('已有任务正在执行中，请等待完成');
            return;
        }

        try {
            isExecuting.value = true
            isAllBlocksCompleted.value = false

            console.log('开始执行，清空缓存')
            blockManager = new BlockManager(promptBlocks.length);
            blockManager.startExecution();
            currentBlockIndex.value = 0

            blockStatuses.value = new Array(promptBlocks.length).fill(null).map(() => ({
                status: 'pending'
            }))
            blockContents.value = new Array(promptBlocks.length).fill('')

            console.log('初始化block管理器:', blockManager.getAllBlockStatuses())
            let outputResult = ''

            const hasAnyPromptBlock = promptBlocks.some(block => block.text.includes('${promptBlock'));

            if (!hasAnyPromptBlock && promptBlocks.length > 1) {
                isParallelMode.value = true;
                totalParallelBlocks.value = promptBlocks.length;
                completedParallelBlocks.value = 0;

                ElNotification({
                    title: '队列处理模式',
                    message: '已启动智能队列处理模式，请耐心等待所有结果返回',
                    type: 'info',
                    duration: 5000
                });

                const executionQueue = ExecuteButtonQueue.getInstance();
                executionQueue.setMaxConcurrent(2);

                for (let i = 0; i < promptBlocks.length; i++) {
                    const processedText = await replaceAllPlaceholders(promptBlocks[i].text, userInputs, promptBlocks);
                    currentBlockIndex.value = i;
                    await nextTick();

                    const model = promptBlocks[i].model === 'inherit' || !promptBlocks[i].model ? getCurrentModel() : promptBlocks[i].model as ModelType;
                    const temperature = promptBlocks[i].temperature === 'inherit' || promptBlocks[i].temperature === undefined ? getCurrentTemperature() : promptBlocks[i].temperature as number;
                    await executionQueue.enqueue(i, processedText, model, async (chunk: string) => {
                        try {
                            if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
                                blockManager?.updateBlockContent(i, chunk);
                                blockContents.value[i] += chunk;
                                blockStatuses.value[i].status = 'streaming';
                                validateBlockStatus(blockManager, i, blockStatuses.value);
                                if (onChunkUpdate) {
                                    await onChunkUpdate(i, chunk);
                                }
                                await nextTick();
                            } else if (chunk.includes('[DONE]')) {
                                blockManager?.completeBlock(i);
                                blockStatuses.value[i].status = 'completed';
                                const progress = blockManager?.getProgress();
                                completedParallelBlocks.value = progress?.completed || 0;
                                if (blockManager?.isAllCompleted()) {
                                    console.log('所有block已完成，等待显示完成状态');
                                }
                                await nextTick();
                            } else if (chunk.includes('[ERROR]')) {
                                const errorMessage = chunk.replace('[ERROR]', '').trim();
                                blockManager?.errorBlock(i, errorMessage);
                                blockStatuses.value[i].status = 'error';
                                blockStatuses.value[i].error = errorMessage;
                                const progress = blockManager?.getProgress();
                                completedParallelBlocks.value = progress?.completed || 0;
                                if (blockManager?.isAllCompleted()) {
                                    console.log('所有block已完成（包含错误），等待显示完成状态');
                                }
                                await nextTick();
                            }
                        } catch (error: any) {
                            console.error(`Error processing chunk for block ${i}:`, error);
                            blockManager?.errorBlock(i, error.message || '处理响应时发生错误');
                            blockStatuses.value[i].status = 'error';
                            blockStatuses.value[i].error = error.message || '处理响应时发生错误';
                            throw error;
                        }
                    }, temperature);
                }
            } else {
                console.log('开始按顺序处理所有提示词块:', promptBlocks)
                for (let i = 0; i < promptBlocks.length; i++) {
                    console.log(`处理第 ${i} 个提示词块:`, promptBlocks[i])
                    currentBlockIndex.value = i

                    const processedText = await replaceAllPlaceholders(promptBlocks[i].text, userInputs, promptBlocks)
                    console.log(`第 ${i} 个提示词块处理完成:`, processedText)

                    await handleStreamResponse(
                        processedText,
                        async (chunk: string, processedChunk: string) => {
                            blockManager?.updateBlockContent(i, processedChunk);
                            blockContents.value[i] += processedChunk;
                            blockStatuses.value[i].status = 'streaming';
                            if (onChunkUpdate) {
                                onChunkUpdate(i, processedChunk);
                            }
                            await nextTick();
                        },
                        {
                            onError: (error: Error) => {
                                console.error('处理提示词块时发生错误:', error);
                                blockManager?.errorBlock(i, error.message);
                                blockStatuses.value[i].status = 'error';
                                blockStatuses.value[i].error = error.message;
                            },
                            model: promptBlocks[i].model === 'inherit' || !promptBlocks[i].model ? getCurrentModel() : promptBlocks[i].model as ModelType,
                            temperature: promptBlocks[i].temperature === 'inherit' || promptBlocks[i].temperature === undefined ? getCurrentTemperature() : promptBlocks[i].temperature as number
                        }
                    );

                    const block = blockManager?.getBlock(i);
                    console.log('状态更新:', {
                        blockIndex: i,
                        status: block?.status,
                        content: block?.content
                    });
                }
            }

            for (let i = 0; i < promptBlocks.length; i++) {
                if (i > 0) {
                    outputResult += '<hr class="block-divider">'
                }
                const content = blockManager?.getBlockContent(i) || '';
                outputResult += `<div class="output-block result-block" id="block-${i}">${marked(content).toString()}</div>`
            }

            const messages: Message[] = [
                {
                    role: 'user',
                    content: JSON.stringify({
                        userInputs,
                        adminInputs,
                        promptBlocks: promptBlocks.map(block => block.text)
                    }, null, 2)
                }
            ]

            for (let i = 0; i < promptBlocks.length; i++) {
                const content = blockManager?.getBlockContent(i);
                if (content) {
                    messages.push({
                        role: 'assistant',
                        content: content
                    });
                }
            }

            return {
                output: outputResult,
                messages
            }

        } catch (error) {
            console.error('执行错误:', error);
            throw error;
        } finally {
            // 简化状态清理，不影响主流程
            console.log('执行完成，清理状态');
            currentBlockIndex.value = -1;
            blockManager?.endExecution();
            isExecuting.value = false;
            isParallelMode.value = false;
            completedParallelBlocks.value = 0;
            totalParallelBlocks.value = 0;
            isAllBlocksCompleted.value = false;
            blockStatuses.value = [];
            blockManager?.reset();
            blockManager = null;
        }
    }

    const setBlockContents = (contents: string[]) => {
        blockContents.value = contents;
        blockStatuses.value = contents.map(content => ({
            status: content ? 'completed' : 'pending'
        }));
    }

    return {
        isExecuting,
        currentBlockIndex,
        executeUserInputs,
        isParallelMode,
        completedParallelBlocks,
        totalParallelBlocks,
        isAllBlocksCompleted,
        blockStatuses,
        blockContents,
        setBlockContents
    }
}
