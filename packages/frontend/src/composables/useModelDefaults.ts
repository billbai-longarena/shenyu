import { ElMessage } from 'element-plus'
import type { ModelType } from '../api/api-deepseekStream'

interface ModelDefaults {
    defaultModel: ModelType
    defaultTemperature: number
}

interface UserModelDefaults extends ModelDefaults {
    lastUpdated: number
}

const LOCAL_STORAGE_KEY = 'user_model_defaults'

export function useModelDefaults() {
    // 读取默认配置
    const loadDefaults = async (): Promise<ModelDefaults | null> => {
        console.log('\n[useModelDefaults] ====== 开始加载默认配置 ======');

        // 先尝试从localStorage读取
        try {
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
                const parsed = JSON.parse(localData) as UserModelDefaults;
                // 检查数据是否过期（7天）
                if (Date.now() - parsed.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
                    console.log('[useModelDefaults] 从localStorage加载配置:', parsed);
                    return {
                        defaultModel: parsed.defaultModel,
                        defaultTemperature: parsed.defaultTemperature
                    };
                }
            }
        } catch (error) {
            console.error('[useModelDefaults] 读取localStorage失败:', error);
        }

        // 如果没有本地数据或已过期，从服务器加载
        try {
            const url = '/model-defaults.json';
            console.log('[useModelDefaults] 从服务器加载配置, URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                throw new Error(`加载默认配置失败: HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('[useModelDefaults] 从服务器加载的配置:', data);

            // 保存到localStorage
            const localData: UserModelDefaults = {
                ...data,
                lastUpdated: Date.now()
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));

            return data;
        } catch (error) {
            console.error('[useModelDefaults] 读取服务器配置失败:', error);
            if (error instanceof Error) {
                console.error('[useModelDefaults] 错误堆栈:', error.stack);
            }
            ElMessage.error('读取默认配置失败');
            return null;
        }
    }

    // 保存默认配置
    const saveDefaults = async (model: ModelType, temperature: number): Promise<boolean> => {
        console.log('[useModelDefaults] 开始保存配置');
        try {
            const config: UserModelDefaults = {
                defaultModel: model,
                defaultTemperature: temperature,
                lastUpdated: Date.now()
            };

            // 保存到localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
            console.log('[useModelDefaults] 配置已保存到localStorage');

            // 保存到服务器
            console.log('[useModelDefaults] 准备保存配置到服务器');
            const response = await fetch('/api/model-defaults/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            const responseText = await response.text();
            console.log('[useModelDefaults] 服务器原始响应:', responseText);

            if (!response.ok) {
                let errorMessage = '保存默认配置失败';
                try {
                    const responseData = JSON.parse(responseText);
                    console.log('[useModelDefaults] 解析的错误响应:', responseData);
                    if (responseData.error?.message) {
                        errorMessage = responseData.error.message;
                    }
                } catch (e) {
                    console.error('[useModelDefaults] 解析响应JSON失败:', e);
                    errorMessage = responseText;
                }
                throw new Error(errorMessage);
            }

            try {
                const responseData = JSON.parse(responseText);
                console.log('[useModelDefaults] 解析的成功响应数据:', responseData);
            } catch (e) {
                console.warn('[useModelDefaults] 响应不是JSON格式:', responseText);
                console.error('[useModelDefaults] JSON解析错误:', e);
            }

            // 验证更新
            console.log('\n[useModelDefaults] ====== 开始验证配置更新 ======');
            console.log('[useModelDefaults] 发送验证请求...');

            // 等待更长时间并尝试多次验证
            const maxRetries = 3;
            for (let i = 0; i < maxRetries; i++) {
                console.log(`[useModelDefaults] 验证尝试 ${i + 1}/${maxRetries}`);

                // 每次尝试之间等待更长时间
                await new Promise(resolve => setTimeout(resolve, 2000));

                const publicResponse = await fetch('/model-defaults.json', {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'If-None-Match': '',  // 忽略 ETag
                        'If-Modified-Since': ''  // 忽略最后修改时间
                    }
                });

                console.log('[useModelDefaults] 验证请求状态:', publicResponse.status);
                console.log('[useModelDefaults] 验证响应头:', Object.fromEntries(publicResponse.headers.entries()));

                if (!publicResponse.ok) {
                    console.warn(`[useModelDefaults] 验证请求 ${i + 1} 失败:`, publicResponse.status);
                    if (i === maxRetries - 1) {
                        throw new Error(`验证请求失败: HTTP ${publicResponse.status}`);
                    }
                    continue;
                }

                const verifyData = await publicResponse.json();
                console.log(`[useModelDefaults] 验证 ${i + 1} 读取的配置:`, verifyData);

                // 详细的配置比较
                console.log('\n[useModelDefaults] ====== 配置比较 ======');
                console.log('期望的配置:', JSON.stringify(config, null, 2));
                console.log('实际的配置:', JSON.stringify(verifyData, null, 2));

                // 验证配置是否真的更新了
                const modelMatch = verifyData.defaultModel === config.defaultModel;
                const tempMatch = verifyData.defaultTemperature === config.defaultTemperature;

                console.log('模型匹配:', modelMatch);
                console.log('温度匹配:', tempMatch);

                if (modelMatch && tempMatch) {
                    console.log(`[useModelDefaults] 验证 ${i + 1} 成功 - 文件已正确更新`);
                    break;
                }

                if (i === maxRetries - 1) {
                    console.warn('[useModelDefaults] 所有验证尝试都失败 - 文件内容与期望不符');
                    throw new Error('配置验证失败：文件内容与期望不符');
                }
            }

            console.log('[useModelDefaults] 配置验证成功 - 文件已正确更新');

            ElMessage.success('默认配置已保存');
            return true;
        } catch (error) {
            console.error('[useModelDefaults] 保存默认配置失败:', error);
            if (error instanceof Error) {
                console.error('[useModelDefaults] 错误堆栈:', error.stack);
            }
            ElMessage.error('保存默认配置失败');
            return false;
        }
    }

    return {
        loadDefaults,
        saveDefaults
    }
}
