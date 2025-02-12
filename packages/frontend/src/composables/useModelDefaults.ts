import { ElMessage } from 'element-plus'
import type { ModelType } from '../api/api-deepseekStream'

interface ModelDefaults {
    defaultModel: ModelType
    defaultTemperature: number
}

export function useModelDefaults() {
    // 读取默认配置
    const loadDefaults = async (): Promise<ModelDefaults | null> => {
        console.log('\n[useModelDefaults] ====== 开始加载默认配置 ======');
        console.log('[useModelDefaults] 环境信息:', {
            MODE: import.meta.env.MODE,
            BASE_URL: import.meta.env.BASE_URL,
            DEV: import.meta.env.DEV,
            PROD: import.meta.env.PROD
        });

        try {
            const url = '/model-defaults.json';
            console.log('[useModelDefaults] 请求URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            console.log('[useModelDefaults] 响应状态:', response.status);
            console.log('[useModelDefaults] 响应头:', Object.fromEntries(response.headers.entries()));
            if (!response.ok) {
                throw new Error(`加载默认配置失败: HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('[useModelDefaults] 加载的配置:', data);
            return data;
        } catch (error) {
            console.error('[useModelDefaults] 读取默认配置失败:', error);
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
            const config: ModelDefaults = {
                defaultModel: model,
                defaultTemperature: temperature
            };

            console.log('[useModelDefaults] 准备保存的配置:', config);
            console.log('[useModelDefaults] 请求URL: /api/model-defaults/save');

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
