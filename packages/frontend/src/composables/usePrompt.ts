import { ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStreamResponse } from './useStreamResponse'

interface PromptProps {
    userInputs: { [key: string]: string }
    promptBlocks: { text: string }[]
}

interface PromptEmits {
    (e: 'update:promptBlocks', value: { text: string }[]): void
    (e: 'update:previewText', value: string): void
    (e: 'update:isPreviewLoading', value: boolean): void
}

export function usePrompt(props: PromptProps, emit: PromptEmits) {
    const lastFocusedIndex = ref<number | null>(null)
    const promptRefs: any[] = []

    // 提示词块焦点处理
    const handlePromptFocus = (index: number) => {
        console.log('Prompt focus:', index)
        lastFocusedIndex.value = index
    }

    // 添加提示词块
    const addPromptBlock = () => {
        const newIndex = props.promptBlocks.length
        console.log('Adding new prompt block at index:', newIndex)
        const newBlocks = [...props.promptBlocks, { text: '' }]
        emit('update:promptBlocks', newBlocks)
        promptRefs[newIndex] = null
        console.log('Current promptRefs array:', promptRefs)
    }

    // 设置提示词输入框的ref
    const setPromptRef = (el: any, index: number) => {
        if (el) {
            promptRefs[index] = el
        }
    }

    const { handleStreamResponse } = useStreamResponse()

    // 替换提示词中的占位符
    const replacePlaceholders = async (text: string): Promise<{
        beforePromptBlock: string,
        promptBlockContent: string,
        afterPromptBlock: string
    }> => {
        // 首先替换inputB占位符
        let result = text.replace(/\${inputB(\d+)}/g, (match, num) => {
            const userKey = `inputA${num}`
            return props.userInputs[userKey] || match
        })

        // 然后查找并处理promptBlock占位符
        const promptBlockRegex = /\${promptBlock(\d+)}/g
        const match = promptBlockRegex.exec(result)

        if (match) {
            const blockIndex = parseInt(match[1]) - 1
            if (blockIndex >= 0 && blockIndex < props.promptBlocks.length) {
                const blockText = props.promptBlocks[blockIndex].text
                if (blockText) {
                    try {
                        // 处理被引用的promptBlock内容
                        const processedBlockText = await replacePlaceholders(blockText)

                        // 分割原始文本
                        const beforePromptBlock = result.substring(0, match.index)
                        const afterPromptBlock = result.substring(match.index + match[0].length)

                        // 组合处理后的文本
                        const promptBlockContent = processedBlockText.beforePromptBlock +
                            (processedBlockText.promptBlockContent || '') +
                            processedBlockText.afterPromptBlock

                        return {
                            beforePromptBlock,
                            promptBlockContent,
                            afterPromptBlock
                        }
                    } catch (error: any) {
                        console.error('处理提示词块占位符时发生错误:', error)
                        return {
                            beforePromptBlock: result,
                            promptBlockContent: `[错误: ${error.message || '未知错误'}]`,
                            afterPromptBlock: ''
                        }
                    }
                }
            }
        }

        // 如果没有promptBlock占位符，返回完整文本作为beforePromptBlock
        return {
            beforePromptBlock: result,
            promptBlockContent: '',
            afterPromptBlock: ''
        }
    }

    // 获取提示词块占位符
    const getPromptBlockPlaceholder = (index: number): string => {
        return `promptBlock${index + 1}`
    }

    // 检查是否可以插入提示词块占位符
    const canInsertPromptBlock = (sourceIndex: number, targetIndex: number): boolean => {
        return targetIndex > sourceIndex
    }

    // 检查文本是否包含 promptBlock 占位符
    const hasPromptBlockPlaceholder = (text: string): boolean => {
        return /\${promptBlock\d+}/.test(text)
    }

    // 预览提示词
    const previewPrompt = async (index: number) => {
        const promptText = props.promptBlocks[index].text
        if (!promptText) {
            ElMessage.warning('请先输入提示词')
            return
        }

        try {
            // 设置加载状态
            emit('update:isPreviewLoading', true)
            emit('update:previewText', '')

            // 处理提示词
            const { beforePromptBlock, promptBlockContent, afterPromptBlock } =
                await replacePlaceholders(promptText)

            if (promptBlockContent) {
                // 记录输入日志
                console.log('[预览提示词] 输入:', {
                    提示词块索引: index,
                    原始文本: promptText,
                    处理后文本: promptBlockContent
                })

                // 显示前缀
                emit('update:previewText', beforePromptBlock)

                // 使用流式处理显示内容
                let accumulatedContent = ''
                const response = await handleStreamResponse(
                    promptBlockContent,
                    (chunk: string, processedChunk: string) => {
                        // 实时更新预览内容，保持前缀
                        if (!chunk.includes('[DONE]') && !chunk.includes('[ERROR]')) {
                            accumulatedContent += processedChunk
                            emit('update:previewText', beforePromptBlock + accumulatedContent)
                        }
                    },
                    {
                        onError: (error) => {
                            console.error('预览提示词时发生错误:', error)
                            emit('update:previewText',
                                beforePromptBlock +
                                `预览失败：${error.message || '未知错误'}` +
                                afterPromptBlock
                            )
                            ElMessage.error('预览失败：' + (error.message || '未知错误'))
                        }
                    }
                )

                // 添加后缀
                const finalContent = beforePromptBlock + accumulatedContent + afterPromptBlock
                emit('update:previewText', finalContent)

                // 记录输出日志
                console.log('[预览提示词] 输出:', {
                    前缀: beforePromptBlock,
                    AI响应: accumulatedContent,
                    后缀: afterPromptBlock,
                    完整结果: finalContent
                })
            } else {
                // 不包含promptBlock占位符，直接显示处理后的文本
                emit('update:previewText', beforePromptBlock)
                console.log('[预览提示词] 直接显示:', beforePromptBlock)
            }
        } catch (error: any) {
            console.error('预览提示词时发生错误:', error)
            emit('update:previewText', `预览失败：${error.message || '未知错误'}`)
            ElMessage.error('预览失败：' + (error.message || '未知错误'))
        } finally {
            emit('update:isPreviewLoading', false)
        }
    }

    // 插入占位符
    const insertPlaceholder = async (key: string) => {
        if (lastFocusedIndex.value === null) {
            ElMessage.warning('请先点击要插入的提示词输入框')
            return
        }

        try {
            const placeholder = `\${${key}}`
            const currentText = props.promptBlocks[lastFocusedIndex.value].text || ''
            const input = promptRefs[lastFocusedIndex.value]

            if (!input?.$el) {
                throw new Error('未找到输入框元素')
            }

            // 获取textarea元素
            const textarea = input.$el.querySelector('textarea')
            if (!textarea) {
                throw new Error('未找到textarea元素')
            }

            // 获取当前选择位置
            const { selectionStart, selectionEnd } = textarea

            // 在光标位置插入占位符
            const newText =
                currentText.slice(0, selectionStart) +
                placeholder +
                currentText.slice(selectionEnd)

            // 保存当前焦点索引和滚动位置
            const currentFocusIndex = lastFocusedIndex.value
            const currentScrollTop = textarea.scrollTop

            // 更新文本
            const newBlocks = props.promptBlocks.map((block, index) => {
                if (index === currentFocusIndex) {
                    return { text: newText }
                }
                return block
            })
            emit('update:promptBlocks', newBlocks)

            // 等待DOM更新后设置光标位置
            await nextTick()
            const newPosition = selectionStart + placeholder.length

            // 重新获取更新后的textarea并设置光标
            const updatedTextarea = input.$el.querySelector('textarea')
            if (updatedTextarea) {
                updatedTextarea.focus()
                updatedTextarea.setSelectionRange(newPosition, newPosition)
                updatedTextarea.scrollTop = currentScrollTop

                // 确保焦点索引保持不变
                lastFocusedIndex.value = currentFocusIndex
            }
        } catch (error) {
            console.error('插入占位符时发生错误:', error)
            ElMessage.error('插入占位符失败：' + (error as Error).message)
        }
    }

    // 删除提示词块
    const deletePromptBlock = async (index: number) => {
        try {
            await ElMessageBox.confirm('确定要删除这个提示词块吗？', '确认删除', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            })

            const newBlocks = props.promptBlocks.filter((_, i) => i !== index)
            emit('update:promptBlocks', newBlocks)

            // 如果删除的是最后一个焦点位置，重置lastFocusedIndex
            if (lastFocusedIndex.value === index) {
                lastFocusedIndex.value = null
            } else if (lastFocusedIndex.value && lastFocusedIndex.value > index) {
                // 如果删除的位置在当前焦点之前，更新焦点位置
                lastFocusedIndex.value--
            }

            ElMessage.success('删除成功')
        } catch (error) {
            // 用户取消删除操作，不做任何处理
            if (error !== 'cancel') {
                console.error('删除提示词块时发生错误:', error)
                ElMessage.error('删除失败：' + (error as Error).message)
            }
        }
    }

    return {
        lastFocusedIndex,
        promptRefs,
        handlePromptFocus,
        addPromptBlock,
        setPromptRef,
        insertPlaceholder,
        previewPrompt,
        getPromptBlockPlaceholder,
        canInsertPromptBlock,
        deletePromptBlock
    }
}
