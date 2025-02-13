import { describe, it, expect, beforeEach, vi } from 'vitest'
import ModelService from '../model-service'
import { ModelType } from '../../types/api'

describe('ModelService', () => {
    let modelService: ModelService

    beforeEach(() => {
        // 重置环境变量
        process.env.DEEPSEEK_API_KEY = 'test-key'
        process.env.KIMI_API_KEY = 'test-kimi-key'
        // 获取新的实例
        modelService = ModelService.getInstance()
        // 重新加载配置
        modelService.reloadConfig()
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
            const config = modelService.getConfig('deepseek')
            expect(config).toMatchObject({
                apiKey: 'test-key',
                url: expect.any(String),
                model: expect.any(String),
                maxTokens: expect.any(Number),
                temperatureRange: expect.any(Object)
            })
        })

        it('应该能够获取所有模型配置', () => {
            const configs = modelService.getAllConfigs()
            expect(configs).toHaveProperty('deepseek')
            expect(configs).toHaveProperty('kimi')
        })
    })

    describe('当前模型管理', () => {
        it('应该能够设置和获取当前模型', () => {
            modelService.setCurrentModel('deepseek')
            expect(modelService.getCurrentModel()).toBe('deepseek')
        })

        it('不应该设置无效的模型', () => {
            const originalModel = modelService.getCurrentModel()
            modelService.setCurrentModel('invalid-model' as ModelType)
            expect(modelService.getCurrentModel()).toBe(originalModel)
        })
    })

    describe('温度管理', () => {
        it('应该能够设置和获取有效的温度值', () => {
            modelService.setCurrentModel('deepseek')
            modelService.setCurrentTemperature(0.7)
            expect(modelService.getCurrentTemperature()).toBe(0.7)
        })

        it('应该验证温度值在有效范围内', () => {
            const model: ModelType = 'deepseek'
            const validTemp = modelService.validateTemperature(model, 0.7)
            const tooHighTemp = modelService.validateTemperature(model, 3.0)
            const tooLowTemp = modelService.validateTemperature(model, -1.0)

            expect(validTemp).toBe(0.7)
            expect(tooHighTemp).toBe(2.0) // max value for deepseek
            expect(tooLowTemp).toBe(0) // min value for deepseek
        })
    })

    describe('Headers生成', () => {
        it('应该为kimi模型生成正确的headers', () => {
            process.env.KIMI_API_KEY = 'sk-test-kimi-key'
            modelService.reloadConfig()
            const headers = modelService.getHeaders('kimi')
            expect(headers['Authorization']).toBe('Bearer sk-test-kimi-key')
        })

        it('应该为yiwan模型生成正确的headers', () => {
            process.env.YIWAN_API_KEY = 'sk-test-yiwan-key'
            modelService.reloadConfig()
            const headers = modelService.getHeaders('yiwan')
            expect(headers['Authorization']).toBe('Bearer test-yiwan-key')
        })

        it('应该为百度API生成正确的headers', () => {
            process.env.BAIDU_API_KEY = 'test-baidu-key'
            modelService.reloadConfig()
            const headers = modelService.getHeaders('baiduDeepseek')
            expect(headers['Authorization']).toBe('Bearer test-baidu-key')
        })

        it('应该为阿里云API生成正确的headers', () => {
            process.env.ALIYUN_API_KEY = 'test-aliyun-key'
            modelService.reloadConfig()
            const headers = modelService.getHeaders('qwen-turbo-latest')
            expect(headers['Authorization']).toBe('Bearer test-aliyun-key')

            const headers2 = modelService.getHeaders('alideepseekv3')
            expect(headers2['Authorization']).toBe('Bearer test-aliyun-key')

            const headers3 = modelService.getHeaders('alideepseekr1')
            expect(headers3['Authorization']).toBe('Bearer test-aliyun-key')
        })

        it('应该为火山API生成正确的headers', () => {
            process.env.VOLCES_API_KEY = 'test-volces-key'
            modelService.reloadConfig()
            const headers = modelService.getHeaders('volcesDeepseek')
            expect(headers['Authorization']).toBe('Bearer test-volces-key')
        })

        it('应该为腾讯云API生成正确的headers', () => {
            process.env.TENCENT_API_KEY = 'test-tencent-key'
            modelService.reloadConfig()
            const headers = modelService.getHeaders('tencentDeepseek')
            expect(headers['Authorization']).toBe('Bearer test-tencent-key')
        })

        it('应该为其他模型生成标准Bearer token with sk-', () => {
            process.env.DEEPSEEK_API_KEY = 'test-deepseek-key'
            modelService.reloadConfig()
            const headers = modelService.getHeaders('deepseek')
            expect(headers['Authorization']).toBe('Bearer sk-test-deepseek-key')
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
            const model: ModelType = 'deepseek'
            const inputTokens = 1000
            const maxTokens = modelService.calculateMaxTokens(model, inputTokens)
            expect(maxTokens).toBeGreaterThan(0)
            expect(Number.isInteger(maxTokens)).toBe(true)
        })
    })
})
