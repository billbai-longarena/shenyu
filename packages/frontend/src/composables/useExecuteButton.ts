import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { marked } from 'marked'
import { useStreamResponse } from './useStreamResponse'
import type { Message } from '../types/chat'
import { getCurrentModel } from '../api/api-deepseekStream'
import { ExecuteButtonQueue } from '../services/executeButton.queue.js'
import { BlockManager } from '../services/blockManager'

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
    // 新增：块内容的响应式状态
    const blockContents = ref<string[]>([])

    // block管理器
    let blockManager: BlockManager | null = null

    // 替换基础占位符（inputB）
    const replaceBasicPlaceholders = (text: string, userInputs: { [key: string]: string }): string => {
        return text.replace(/\${inputB(\d+)}/g, (match, num) => {
            const userKey = `inputA${num}`
            return userInputs[userKey] || match
        })
    }

    // 替换所有占位符（包括promptBlock和inputB）
    const replaceAllPlaceholders = async (text: string, userInputs: { [key: string]: string }, promptBlocks: { text: string }[]): Promise<string> => {
        console.log('开始替换占位符:', text)

        // 首先替换inputB占位符
        let result = replaceBasicPlaceholders(text, userInputs)
        console.log('替换基础占位符后:', result)

        // 收集所有需要处理的promptBlock
        const matches: { index: number, match: string }[] = []
        const promptBlockRegex = /\${promptBlock(\d+)}/g
        let match
        while ((match = promptBlockRegex.exec(result)) !== null) {
            const blockIndex = parseInt(match[1]) - 1
            if (blockIndex >= 0 && blockIndex < promptBlocks.length) {
                matches.push({ index: blockIndex, match: match[0] })
            }
        }

        // 并行处理所有promptBlock
        if (matches.length > 0) {
            const processPromises = matches.map(async ({ index, match }) => {
                // 检查缓存
                const block = blockManager?.getBlock(index);
                if (block && block.content) {
                    console.log(`使用缓存的结果 [Block ${index}]:`, block.content)
                    return { match, content: block.content }
                }

                console.log(`需要处理新的Block [${index}]`)
                const blockText = promptBlocks[index].text
                if (blockText) {
                    try {
                        // 递归处理被引用的块
                        const processedText = await replaceAllPlaceholders(blockText, userInputs, promptBlocks)
                        console.log(`处理Block ${index}的结果:`, processedText)

                        // 调用AI获取响应
                        const response = await handleStreamResponse(
                            processedText,
                            async (chunk: string, processedChunk: string) => {
                                blockManager?.updateBlockContent(index, processedChunk);
                            },
                            {
                                onError: (error: Error) => {
                                    console.error('处理提示词块时发生错误:', error)
                                    blockManager?.errorBlock(index, error.message);
                                }
                            }
                        )

                        // 确保最终内容被正确缓存
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

            // 等待所有处理完成并替换内容
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
        promptBlocks: { text: string }[],
        onChunkUpdate?: (blockIndex: number, chunk: string) => void
    ) => {
        if (promptBlocks.length === 0) {
            throw new Error('请先添加提示词块')
        }

        // 检查是否已经在执行中
        if (blockManager?.isCurrentlyExecuting()) {
            console.log('已有任务正在执行中，请等待完成');
            return;
        }

        try {
            // 初始化状态
            isExecuting.value = true
            isAllBlocksCompleted.value = false

            // 标记开始执行
            console.log('开始执行，清空缓存')
            // 初始化block管理器并标记开始执行
            blockManager = new BlockManager(promptBlocks.length);
            blockManager.startExecution();
            currentBlockIndex.value = 0

            // 初始化状态
            blockStatuses.value = new Array(promptBlocks.length).fill(null).map(() => ({
                status: 'pending'
            }))
            // 初始化块内容
            blockContents.value = new Array(promptBlocks.length).fill('')

            console.log('初始化block管理器:', blockManager.getAllBlockStatuses())
            let outputResult = ''

            // 检查是否所有块都不包含promptBlock占位符
            const hasAnyPromptBlock = promptBlocks.some(block => block.text.includes('${promptBlock'));

            // 如果没有任何promptBlock占位符且块数大于1，使用队列处理
            if (!hasAnyPromptBlock && promptBlocks.length > 1) {
                isParallelMode.value = true;
                totalParallelBlocks.value = promptBlocks.length;
                completedParallelBlocks.value = 0;

                // 显示队列处理模式通知
                ElNotification({
                    title: '队列处理模式',
                    message: '已启动智能队列处理模式，请耐心等待所有结果返回',
                    type: 'info',
                    duration: 5000
                });

                const executionQueue = ExecuteButtonQueue.getInstance();
                executionQueue.setMaxConcurrent(2); // 设置最大并发数为2

                // 按顺序处理所有块
                for (let i = 0; i < promptBlocks.length; i++) {
                    const processedText = await replaceAllPlaceholders(promptBlocks[i].text, userInputs, promptBlocks);

                    // 确保在开始处理前block已经被正确初始化
                    currentBlockIndex.value = i;
                    await nextTick();

                    await executionQueue.enqueue(i, processedText, getCurrentModel(), async (chunk: string) => {
                        try {
                            if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
                                // 更新BlockManager
                                blockManager?.updateBlockContent(i, chunk);
                                // 同步响应式状态
                                blockContents.value[i] += chunk;
                                blockStatuses.value[i].status = 'streaming';

                                // 验证状态同步
                                validateBlockStatus(blockManager, i, blockStatuses.value);

                                if (onChunkUpdate) {
                                    await onChunkUpdate(i, chunk);
                                }

                                // 确保视图更新
                                await nextTick();
                            } else if (chunk.includes('[DONE]')) {
                                blockManager?.completeBlock(i);
                                blockStatuses.value[i].status = 'completed';
                                const progress = blockManager?.getProgress();
                                completedParallelBlocks.value = progress?.completed || 0;
                                console.log(`Block ${i} completed. Progress:`, progress);

                                // 检查是否所有block都已完成
                                if (blockManager?.isAllCompleted()) {
                                    console.log('所有block已完成，等待显示完成状态');
                                }

                                // 强制触发视图更新
                                await nextTick();
                            } else if (chunk.includes('[ERROR]')) {
                                const errorMessage = chunk.replace('[ERROR]', '').trim();
                                console.error(`Block ${i} failed:`, errorMessage);
                                blockManager?.errorBlock(i, errorMessage);
                                blockStatuses.value[i].status = 'error';
                                blockStatuses.value[i].error = errorMessage;
                                const progress = blockManager?.getProgress();
                                completedParallelBlocks.value = progress?.completed || 0;

                                // 检查是否所有block都已完成（包括错误状态）
                                if (blockManager?.isAllCompleted()) {
                                    console.log('所有block已完成（包含错误），等待显示完成状态');
                                }

                                // 强制触发视图更新
                                await nextTick();
                            }
                        } catch (error: any) {
                            console.error(`Error processing chunk for block ${i}:`, error);
                            blockManager?.errorBlock(i, error.message || '处理响应时发生错误');
                            blockStatuses.value[i].status = 'error';
                            blockStatuses.value[i].error = error.message || '处理响应时发生错误';
                            throw error;
                        }
                    });
                }
            } else {
                // 按顺序处理所有提示词块
                console.log('开始按顺序处理所有提示词块:', promptBlocks)
                for (let i = 0; i < promptBlocks.length; i++) {
                    console.log(`处理第 ${i} 个提示词块:`, promptBlocks[i].text)
                    currentBlockIndex.value = i

                    // 处理当前块（包括所有占位符）
                    console.log(`处理第 ${i} 个提示词块:`, promptBlocks[i].text)
                    const processedText = await replaceAllPlaceholders(promptBlocks[i].text, userInputs, promptBlocks)
                    console.log(`第 ${i} 个提示词块处理完成:`, processedText)

                    // 处理当前块
                    await handleStreamResponse(
                        processedText,
                        async (chunk: string, processedChunk: string) => {
                            if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
                                // 更新BlockManager
                                blockManager?.updateBlockContent(i, processedChunk);
                                // 同步响应式状态
                                blockContents.value[i] += processedChunk;
                                blockStatuses.value[i].status = 'streaming';

                                // 调用更新回调
                                if (onChunkUpdate) {
                                    onChunkUpdate(i, processedChunk);
                                }

                                // 确保视图更新
                                await nextTick();
                            } else if (chunk.includes('[DONE]')) {
                                blockManager?.completeBlock(i);
                                blockStatuses.value[i].status = 'completed';
                                // 验证状态同步
                                validateBlockStatus(blockManager, i, blockStatuses.value);
                                // 检查是否所有block都已完成
                                if (blockManager?.isAllCompleted()) {
                                    console.log('所有block已完成，等待显示完成状态');
                                }
                            } else if (chunk.includes('[ERROR]')) {
                                const errorMessage = chunk.replace('[ERROR]', '').trim();
                                blockManager?.errorBlock(i, errorMessage);
                                blockStatuses.value[i].status = 'error';
                                blockStatuses.value[i].error = errorMessage;
                                // 验证状态同步
                                validateBlockStatus(blockManager, i, blockStatuses.value);
                                // 检查是否所有block都已完成（包括错误状态）
                                if (blockManager?.isAllCompleted()) {
                                    console.log('所有block已完成（包含错误），等待显示完成状态');
                                }
                            }
                        },
                        {
                            onError: (error: Error) => {
                                console.error('处理提示词块时发生错误:', error);
                                blockManager?.errorBlock(i, error.message);
                                blockStatuses.value[i].status = 'error';
                                blockStatuses.value[i].error = error.message;
                            }
                        }
                    );

                    const block = blockManager?.getBlock(i);
                    console.log('状态更新:', {
                        blockIndex: i,
                        status: block?.status,
                        content: block?.content
                    })
                }
            }

            // 构建输出结果
            for (let i = 0; i < promptBlocks.length; i++) {
                if (i > 0) {
                    outputResult += '<hr class="block-divider">'
                }
                const content = blockManager?.getBlockContent(i) || '';
                outputResult += `<div class="output-block result-block" id="block-${i}">${marked(content).toString()}</div>`
            }

            // 创建消息数组
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

            // 添加所有AI响应
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
            console.error('执行过程中发生错误:', error);
            throw error;
        } finally {
            console.log('执行完成，清空缓存');
            // 执行完成后清理
            currentBlockIndex.value = -1;
            blockManager?.endExecution(); // 确保执行状态被重置
            const finalStatuses = blockManager?.getAllBlockStatuses();
            console.log('最终block状态:', finalStatuses);

            // 检查是否所有block都已完成
            const allCompleted = blockManager?.isAllCompleted() || false;
            console.log('[useExecution] Checking completion status:', {
                allCompleted,
                blockStatuses: blockManager?.getAllBlockStatuses()
            });

            if (allCompleted) {
                console.log('[useExecution] All blocks completed, waiting before cleanup...');
                // 设置完成状态，触发淡出动画
                isAllBlocksCompleted.value = true;

                // 等待3秒让淡出动画完成
                await new Promise(resolve => setTimeout(resolve, 3000));

                // 最后清理状态
                console.log('[useExecution] Cleaning up states...');
                isExecuting.value = false;
                isParallelMode.value = false;
                completedParallelBlocks.value = 0;
                totalParallelBlocks.value = 0;
                isAllBlocksCompleted.value = false;
                blockStatuses.value = [];
                blockManager?.reset();
                blockManager = null;
            } else {
                console.log('[useExecution] Not all blocks completed yet, keeping states...');
            }
        }
    }

    // 设置块内容
    const setBlockContents = (contents: string[]) => {
        blockContents.value = contents;
        // 同步更新blockStatuses
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
        setBlockContents  // 导出新方法
    }
}
