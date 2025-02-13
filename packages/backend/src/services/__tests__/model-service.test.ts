import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import ModelService from '../model-service'
import { ModelType } from '../../types/api'

describe('ModelService', () => {
    let modelService: ModelService
    const originalEnv = { ...process.env }

    // 获取可用的模型
    const getAvailableModel = () => {
        const models = modelService.getAllConfigs()
        return Object.entries(models)
            .find(([_, config]) => config.apiKey)
            ?.[0] as ModelType | undefined
    }

    beforeEach(() => {
        // 设置测试用的API key
        const testKey = 'test-key-' + Date.now()
        process.env.DEEPSEEK_API_KEY = testKey
        // 获取新的实例
        modelService = ModelService.getInstance()
        // 重新加载配置
        modelService.reloadConfig()
    })

    afterAll(() => {
        // 恢复原始环境变量
        process.env = { ...originalEnv }
    })

    describe('单例模式', () => {
        it('应该返回相同的实例', () => {
            const instance1 = ModelService.getInstance()
            const instance2 = ModelService.getInstance()
            expect(instance1).toBe(instance2)
        })
    })

    describe('模型配置管理', () => {
        it('应该能够获取特定模型的配置', () => {
            const availableModel = getAvailableModel()
            if (!availableModel) {
                console.warn('没有配置任何模型的API key，跳过测试')
                return
            }
            const config = modelService.getConfig(availableModel)
            expect(config).toMatchObject({
                apiKey: expect.any(String),
                url: expect.any(String),
                model: expect.any(String),
                maxTokens: expect.any(Number),
                temperatureRange: expect.any(Object)
            })
        })

        it('应该能够获取所有模型配置', () => {
            const configs = modelService.getAllConfigs()
            expect(Object.keys(configs).length).toBeGreaterThan(0)
        })
    })

    describe('当前模型管理', () => {
        it('应该能够设置和获取当前模型', () => {
            const availableModel = getAvailableModel()
            if (!availableModel) {
                console.warn('没有配置任何模型的API key，跳过测试')
                return
            }
            modelService.setCurrentModel(availableModel)
            expect(modelService.getCurrentModel()).toBe(availableModel)
        })

        it('不应该设置无效的模型', () => {
            const originalModel = modelService.getCurrentModel()
            modelService.setCurrentModel('invalid-model' as ModelType)
            expect(modelService.getCurrentModel()).toBe(originalModel)
        })
    })

    describe('温度管理', () => {
        it('应该能够设置和获取有效的温度值', () => {
            const availableModel = getAvailableModel()
            if (!availableModel) {
                console.warn('没有配置任何模型的API key，跳过测试')
                return
            }
            modelService.setCurrentModel(availableModel)
            modelService.setCurrentTemperature(0.7)
            expect(modelService.getCurrentTemperature()).toBe(0.7)
        })

        it('应该验证温度值在有效范围内', () => {
            const availableModel = getAvailableModel()
            if (!availableModel) {
                console.warn('没有配置任何模型的API key，跳过测试')
                return
            }
            const validTemp = modelService.validateTemperature(availableModel, 0.7)
            const tooHighTemp = modelService.validateTemperature(availableModel, 3.0)
            const tooLowTemp = modelService.validateTemperature(availableModel, -1.0)

            expect(validTemp).toBe(0.7)
            expect(tooHighTemp).toBeLessThanOrEqual(2.0)
            expect(tooLowTemp).toBeGreaterThanOrEqual(0)
        })
    })

    describe('Headers生成', () => {
        it('应该为配置的模型生成正确的headers', () => {
            const availableModel = getAvailableModel()
            if (!availableModel) {
                console.warn('没有配置任何模型的API key，跳过测试')
                return
            }
            const headers = modelService.getHeaders(availableModel)
            expect(headers).toHaveProperty('Authorization')
            expect(headers['Authorization']).toMatch(/^Bearer/)
        })

        it('应该处理不同类型的Authorization token格式', () => {
            const availableModel = getAvailableModel()
            if (!availableModel) {
                console.warn('没有配置任何模型的API key，跳过测试')
                return
            }
            const headers = modelService.getHeaders(availableModel)
            const authToken = headers['Authorization']

            // 验证token格式正确
            expect(authToken).toMatch(/^Bearer\s+.+/)
            // 验证token不为空
            expect(authToken.split(' ')[1]).toBeTruthy()
        })
    })

    describe('Token计算', () => {
        it('应该能够估算文本的token数量', () => {
            const text = 'Hello, World!'
            const tokens = modelService.estimateTokens(text)
            expect(tokens).toBeGreaterThan(0)
            expect(Number.isInteger(tokens)).toBe(true)
        })

        it('应该能够计算最大可用tokens', () => {
            const availableModel = getAvailableModel()
            if (!availableModel) {
                console.warn('没有配置任何模型的API key，跳过测试')
                return
            }
            const inputTokens = 1000
            const maxTokens = modelService.calculateMaxTokens(availableModel, inputTokens)
            expect(maxTokens).toBeGreaterThan(0)
            expect(Number.isInteger(maxTokens)).toBe(true)
        })
    })
})
