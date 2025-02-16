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
            promptBlocks: {} as { [key: string]: string }
        }
        // 将数组转换为对象格式
        props.promptBlocks.forEach((block, index) => {
            config.promptBlocks[`promptBlock${index + 1}`] = block.text
        })

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

    // 验证配置格式
    const validateConfig = (config: any): boolean => {
        if (!config || typeof config !== 'object') {
            ElMessage.error('配置必须是一个有效的对象');
            return false;
        }

        if (!config.adminInputs || typeof config.adminInputs !== 'object') {
            ElMessage.error('配置必须包含有效的adminInputs对象');
            return false;
        }

        // 验证promptBlocks格式
        if (!config.promptBlocks) {
            ElMessage.error('配置必须包含promptBlocks');
            return false;
        }

        // 验证adminInputs中的<def>标签格式
        for (const [key, value] of Object.entries(config.adminInputs)) {
            if (typeof value !== 'string') {
                ElMessage.error(`adminInputs中的${key}必须是字符串类型`);
                return false;
            }

            const openTags = (value.match(/<def>/g) || []).length;
            const closeTags = (value.match(/<\/def>/g) || []).length;
            if (openTags !== closeTags) {
                ElMessage.error(`adminInputs中的${key}的<def>标签不匹配`);
                return false;
            }
        }

        // 验证promptBlocks格式（支持数组和对象两种格式）
        if (Array.isArray(config.promptBlocks)) {
            // 旧格式验证
            for (const [index, block] of config.promptBlocks.entries()) {
                if (typeof block !== 'string') {
                    ElMessage.error(`promptBlocks中的第${index + 1}项必须是字符串类型`);
                    return false;
                }
            }
        } else if (typeof config.promptBlocks === 'object') {
            // 新格式验证
            for (const [key, value] of Object.entries(config.promptBlocks)) {
                if (!key.match(/^promptBlock\d+$/)) {
                    ElMessage.error(`无效的promptBlock键名: ${key}`);
                    return false;
                }
                if (typeof value !== 'string') {
                    ElMessage.error(`promptBlocks中的${key}必须是字符串类型`);
                    return false;
                }
            }
        } else {
            ElMessage.error('promptBlocks必须是数组或对象');
            return false;
        }

        return true;
    }

    // 导入配置
    const importConfig = async (config: any, charDelay: number = 120): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            try {
                // 验证配置
                if (!validateConfig(config)) {
                    reject(new Error('配置验证失败'));
                    return;
                }

                // 清空现有配置
                emit('update:adminInputs', {})
                emit('update:promptBlocks', [])
                emit('update:userInputs', {})

                const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                const blockDelay = 200; // 每个块的延迟时间（毫秒）

                // 创建一个函数来处理文本的流式渲染
                const streamText = async (text: string, currentText: string = ''): Promise<string> => {
                    if (text === currentText) return text;

                    // 找到下一个完整的行或段落
                    let nextLength = currentText.length;
                    const remainingText = text.slice(currentText.length);

                    // 如果当前位置是换行符，直接返回整个文本
                    if (remainingText.startsWith('\n')) {
                        return text;
                    }

                    // 找到下一个换行符
                    const nextNewline = remainingText.indexOf('\n');
                    if (nextNewline !== -1) {
                        // 如果找到换行符，处理整个段落
                        nextLength = currentText.length + nextNewline + 1;
                        await delay(charDelay);
                        return text.slice(0, nextLength);
                    }

                    // 如果没有换行符，处理剩余的所有文本
                    await delay(charDelay);
                    return text;
                };

                // 导入新配置
                if (config.adminInputs) {
                    const newAdminInputs: { [key: string]: string } = {};
                    const newUserInputs: { [key: string]: string } = {};

                    // 按顺序处理每个adminInput
                    for (const [key, value] of Object.entries(config.adminInputs)) {
                        let currentText = '';
                        newAdminInputs[key] = '';

                        // 流式渲染文本
                        while (currentText !== value) {
                            currentText = await streamText(value as string, currentText);
                            newAdminInputs[key] = currentText;
                            emit('update:adminInputs', { ...newAdminInputs });
                        }

                        // 同步创建用户输入框
                        const num = key.replace('inputB', '');
                        const userKey = `inputA${num}`;
                        newUserInputs[userKey] = '';

                        // 如果有默认值（<def>标签中的内容），提取并设置
                        try {
                            // 使用更健壮的正则表达式来匹配<def>标签
                            const match = (value as string).match(/<def>([\s\S]*?)<\/def>/);
                            if (match) {
                                // 验证标签的完整性
                                const fullText = value as string;
                                const openTags = (fullText.match(/<def>/g) || []).length;
                                const closeTags = (fullText.match(/<\/def>/g) || []).length;

                                if (openTags !== closeTags) {
                                    console.warn(`警告：输入 ${key} 中的<def>标签不匹配`);
                                }

                                // 提取并清理默认值
                                const defaultValue = match[1].trim();
                                newUserInputs[userKey] = defaultValue;
                            }
                        } catch (error) {
                            console.error(`解析输入 ${key} 的默认值时出错:`, error);
                            ElMessage.warning(`解析输入 ${key} 的默认值时出错`);
                        }
                    }

                    emit('update:userInputs', newUserInputs);

                    // 更新计数器
                    const maxNumber = Math.max(
                        ...Object.keys(config.adminInputs)
                            .map(key => parseInt(key.replace('inputB', '')))
                            .filter(num => !isNaN(num)),
                        0
                    );
                    emit('update:inputCounter', maxNumber);
                }

                if (config.promptBlocks) {
                    const texts: string[] = [];
                    const allBlocks: { text: string }[] = [];

                    // 首先收集所有文本
                    if (Array.isArray(config.promptBlocks)) {
                        texts.push(...config.promptBlocks);
                    } else {
                        // 按照promptBlock1, promptBlock2...的顺序排序
                        const sortedKeys = Object.keys(config.promptBlocks)
                            .sort((a, b) => {
                                const numA = parseInt(a.replace('promptBlock', ''));
                                const numB = parseInt(b.replace('promptBlock', ''));
                                return numA - numB;
                            });
                        texts.push(...sortedKeys.map(key => config.promptBlocks[key]));
                    }

                    // 初始化所有块的内容
                    texts.forEach((text) => allBlocks.push({ text: '' }));
                    emit('update:promptBlocks', allBlocks);

                    // 逐个更新块的内容
                    for (let i = 0; i < texts.length; i++) {
                        let currentText = '';
                        const text = texts[i];

                        while (currentText !== text) {
                            currentText = await streamText(text, currentText);
                            // 更新当前块，保持其他块的内容不变
                            allBlocks[i] = { text: currentText };
                            // 创建新数组以触发响应式更新
                            emit('update:promptBlocks', [...allBlocks]);

                            if (currentText === text) {
                                await delay(blockDelay);
                            } else {
                                await delay(charDelay);
                            }
                        }
                    }
                }

                ElMessage.success('配置导入成功');
                resolve();
            } catch (error) {
                console.error('导入配置失败:', error)
                ElMessage.error('配置文件格式错误')
                reject(error);
            }
        });
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
