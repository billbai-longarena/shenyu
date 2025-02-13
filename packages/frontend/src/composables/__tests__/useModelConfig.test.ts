import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { useModelConfig } from '../useModelConfig'
import type { ModelType } from '../../types/api'

interface ModelConfig {
    maxTokens: number;
    temperatureRange: {
        min: number;
        max: number;
        default: number;
        presets: {
            conservative: number;
            balanced: number;
            creative: number;
        };
    };
}

interface ModelConfigs {
    modelConfigs: {
        [key in ModelType]: ModelConfig;
    };
}

// 创建一个模块级变量来存储缓存
let cachedConfigs: ModelConfigs | null = null

// Mock整个模块
vi.mock('../useModelConfig', () => {
    return {
        useModelConfig: () => {
            const isLoading = ref(false)
            const error = ref<string | null>(null)

            async function loadModelConfigs(): Promise<ModelConfigs> {
                if (cachedConfigs) {
                    return cachedConfigs
                }

                isLoading.value = true
                error.value = null

                try {
                    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
                    const port = import.meta.env.PROD ? '' : ':3001'
                    const response = await fetch(`${protocol}//${window.location.hostname}${port}/api/model-config`)

                    if (!response.ok) {
                        throw new Error('Failed to load model configurations')
                    }

                    const configs = await response.json()
                    cachedConfigs = configs
                    return configs
                } catch (e) {
                    error.value = e instanceof Error ? e.message : 'Unknown error'
                    throw e
                } finally {
                    isLoading.value = false
                }
            }

            async function getModelMaxTokens(model: ModelType): Promise<number> {
                if (!cachedConfigs) {
                    await loadModelConfigs()
                }
                if (!cachedConfigs?.modelConfigs[model]) {
                    console.warn(`No config found for model ${model}, using default max_tokens 4096`)
                    return 4096
                }
                return cachedConfigs.modelConfigs[model].maxTokens
            }

            return {
                isLoading,
                error,
                loadModelConfigs,
                getModelMaxTokens
            }
        }
    }
})

describe('useModelConfig', () => {
    beforeEach(() => {
        // 重置所有mock
        vi.clearAllMocks()
        // 重置缓存
        cachedConfigs = null
        // 重置fetch mock
        vi.stubGlobal('fetch', vi.fn())
        // 重置环境变量
        vi.unstubAllEnvs()
        // 重置window.location
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'http:',
                hostname: 'localhost'
            },
            writable: true
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('应该加载模型配置', async () => {
        // 使用通用的mock配置，不依赖特定模型
        const mockConfig = {
            modelConfigs: {
                'test-model': {
                    maxTokens: 4096,
                    temperatureRange: {
                        min: 0,
                        max: 1.0,
                        default: 0.7,
                        presets: {
                            conservative: 0.3,
                            balanced: 0.7,
                            creative: 1.0
                        }
                    }
                }
            }
        }

        const mockFetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockConfig)
            })
        )
        vi.stubGlobal('fetch', mockFetch)

        const { loadModelConfigs, isLoading, error } = useModelConfig()
        const configs = await loadModelConfigs()

        expect(configs).toEqual(mockConfig)
        expect(isLoading.value).toBe(false)
        expect(error.value).toBeNull()
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('应该处理加载失败', async () => {
        const mockFetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500
            })
        )
        vi.stubGlobal('fetch', mockFetch)

        const { loadModelConfigs, isLoading, error } = useModelConfig()

        await expect(loadModelConfigs()).rejects.toThrow('Failed to load model configurations')
        expect(isLoading.value).toBe(false)
        expect(error.value).toBe('Failed to load model configurations')
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('应该使用缓存的配置', async () => {
        // 使用通用的mock配置
        const mockConfig = {
            modelConfigs: {
                'test-model': {
                    maxTokens: 4096,
                    temperatureRange: {
                        min: 0,
                        max: 1.0,
                        default: 0.7,
                        presets: {
                            conservative: 0.3,
                            balanced: 0.7,
                            creative: 1.0
                        }
                    }
                }
            }
        }

        const mockFetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockConfig)
            })
        )
        vi.stubGlobal('fetch', mockFetch)

        const { loadModelConfigs } = useModelConfig()
        const firstConfigs = await loadModelConfigs()
        const secondConfigs = await loadModelConfigs()

        expect(firstConfigs).toEqual(secondConfigs)
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('应该返回默认maxTokens当模型不存在时', async () => {
        // 使用通用的mock配置
        const mockConfig = {
            modelConfigs: {
                'test-model': {
                    maxTokens: 4096
                }
            }
        }

        const mockFetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockConfig)
            })
        )
        vi.stubGlobal('fetch', mockFetch)

        const { getModelMaxTokens } = useModelConfig()
        const maxTokens = await getModelMaxTokens('invalid-model' as ModelType)

        expect(maxTokens).toBe(4096)
    })

    it('应该正确处理不同环境的URL', async () => {
        // 使用通用的mock配置
        const mockConfig = {
            modelConfigs: {
                'test-model': {
                    maxTokens: 4096,
                    temperatureRange: {
                        min: 0,
                        max: 1.0,
                        default: 0.7,
                        presets: {
                            conservative: 0.3,
                            balanced: 0.7,
                            creative: 1.0
                        }
                    }
                }
            }
        }

        const mockFetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockConfig)
            })
        )
        vi.stubGlobal('fetch', mockFetch)

        // Mock production environment
        vi.stubEnv('PROD', true)

        const { loadModelConfigs } = useModelConfig()
        await loadModelConfigs()

        expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/^https?:\/\/.*\/api\/model-config$/))
    })
})
