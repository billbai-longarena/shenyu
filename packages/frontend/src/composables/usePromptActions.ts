import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useLanguage } from './useLanguage'
import { usePrompt } from './usePrompt'
import type { ModelType } from '../api/api-deepseekStream'
import type { PromptProps, PromptBlock } from './usePrompt'

interface Emits {
    (e: 'update:promptBlocks', value: PromptBlock[]): void
    (e: 'update:previewText', value: string): void
    (e: 'update:isPreviewLoading', value: boolean): void
    (e: 'config-modified'): void
}

type Props = PromptProps

export function usePromptActions(props: Props, emit: Emits) {
    const { t } = useLanguage()

    // 复用usePrompt中的核心功能
    const {
        lastFocusedIndex,
        promptRefs,
        handlePromptFocus,
        addPromptBlock: addPromptBlockBase,
        setPromptRef,
        insertPlaceholder: insertPlaceholderBase,
        previewPrompt,
        getPromptBlockPlaceholder,
        canInsertPromptBlock: canInsertPromptBlockBase,
        deletePromptBlock,
        hasPlaceholder
    } = usePrompt(props, emit)

    // 包装insertPlaceholder函数
    const insertPlaceholder = (key: string) => {
        insertPlaceholderBase(key)
        emit('config-modified')
    }

    // 包装canInsertPromptBlock函数
    const canInsertPromptBlock = (sourceIndex: number, targetIndex: number): boolean => {
        return canInsertPromptBlockBase(sourceIndex, targetIndex)
    }

    // 更新提示词文本
    const updatePromptText = (index: number, value: string) => {
        const newBlocks = props.promptBlocks.map((block, i) => {
            if (i === index) {
                return { ...block, text: value }
            }
            return block
        })
        emit('update:promptBlocks', newBlocks)
        emit('config-modified')
    }

    // 更新prompt block的模型设置
    const updatePromptModel = (index: number, model: ModelType | 'inherit') => {
        const newBlocks = props.promptBlocks.map((block, i) => {
            if (i === index) {
                return { ...block, model }
            }
            return { ...block }
        })
        emit('update:promptBlocks', newBlocks)
        emit('config-modified')
    }

    // 更新prompt block的温度设置
    const updatePromptTemperature = (index: number, temperature: 'conservative' | 'balanced' | 'creative' | 'inherit') => {
        const temperatureValueMap = {
            conservative: 0,
            balanced: 0.5,
            creative: 0.9,
            inherit: 'inherit'
        } as const

        const newBlocks = props.promptBlocks.map((block, i) => {
            if (i === index) {
                return {
                    ...block,
                    temperature: temperatureValueMap[temperature]
                }
            }
            return { ...block }
        })
        emit('update:promptBlocks', newBlocks)
        emit('config-modified')
    }

    // 添加提示词块的包装函数
    const addPromptBlock = () => {
        addPromptBlockBase()
        emit('config-modified')
    }

    // 插入提示词块占位符
    const insertPromptBlock = (index: number) => {
        if (lastFocusedIndex.value === null) {
            ElMessage.warning(t('configPanel.insertWarning'))
            return
        }

        if (!canInsertPromptBlock(index, lastFocusedIndex.value)) {
            ElMessage.warning(t('configPanel.insertBlockWarning'))
            return
        }

        insertPlaceholder(getPromptBlockPlaceholder(index))
        emit('config-modified')
    }

    // 保存滚动位置
    const saveScrollPosition = (element: HTMLElement | null) => {
        return element?.scrollTop || 0
    }

    // 恢复滚动位置
    const restoreScrollPosition = (element: HTMLElement | null, position: number) => {
        if (element) {
            element.scrollTop = position
        }
    }

    return {
        lastFocusedIndex,
        promptRefs,
        handlePromptFocus,
        setPromptRef,
        updatePromptText,
        updatePromptModel,
        updatePromptTemperature,
        addPromptBlock,
        insertPromptBlock,
        previewPrompt,
        deletePromptBlock,
        hasPlaceholder,
        saveScrollPosition,
        restoreScrollPosition,
        // 添加缺失的函数
        insertPlaceholder,
        canInsertPromptBlock
    }
}
