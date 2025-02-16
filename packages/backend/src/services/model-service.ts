import { ModelType } from '../types/api.js';

interface ModelConfig {
    apiKey: string;
    url: string;
    model: string;
    maxTokens: number;
    temperatureRange: {
        min: number;
        max: number;
    };
}

// 打印环境变量状态
console.log('[ModelService] Environment variables status:', {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'exists' : 'missing',
    SILICON_DEEPSEEK_API_KEY: process.env.SILICON_DEEPSEEK_API_KEY ? 'exists' : 'missing',
    KIMI_API_KEY: process.env.KIMI_API_KEY ? 'exists' : 'missing',
    YIWAN_API_KEY: process.env.YIWAN_API_KEY ? 'exists' : 'missing',
    BAIDU_API_KEY: process.env.BAIDU_API_KEY ? 'exists' : 'missing',
    ALIYUN_API_KEY: process.env.ALIYUN_API_KEY ? 'exists' : 'missing',
    VOLCES_API_KEY: process.env.VOLCES_API_KEY ? 'exists' : 'missing',
    TENCENT_API_KEY: process.env.TENCENT_API_KEY ? 'exists' : 'missing',
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY ? 'exists' : 'missing'
});

// API配置
let API_CONFIGS: Record<ModelType, ModelConfig>;

function createConfigs(): Record<ModelType, ModelConfig> {
    return {
        deepseek: {
            apiKey: process.env.DEEPSEEK_API_KEY || '',
            url: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-chat',
            maxTokens: 8191,
            temperatureRange: {
                min: 0,
                max: 2.0
            }
        },
        siliconDeepseek: {
            apiKey: process.env.SILICON_DEEPSEEK_API_KEY || '',
            url: 'https://api.siliconflow.cn/v1/chat/completions',
            model: 'deepseek-ai/DeepSeek-V3',
            maxTokens: 4096,
            temperatureRange: {
                min: 0,
                max: 2.0
            }
        },
        kimi: {
            apiKey: process.env.KIMI_API_KEY || '',
            url: 'https://api.moonshot.cn/v1/chat/completions',
            model: 'moonshot-v1-8k',
            maxTokens: 4096,
            temperatureRange: {
                min: 0,
                max: 1
            }
        },
        yiwan: {
            apiKey: process.env.YIWAN_API_KEY || '',
            url: 'https://api.lingyiwanwu.com/v1/chat/completions',
            model: 'yi-lightning',
            maxTokens: 8092,
            temperatureRange: {
                min: 0,
                max: 1
            }
        },
        baiduDeepseek: {
            apiKey: process.env.BAIDU_API_KEY || '',
            url: 'https://qianfan.baidubce.com/v2/chat/completions',
            model: 'deepseek-v3',
            maxTokens: 4092,
            temperatureRange: {
                min: 0,
                max: 2.0
            }
        },
        'qwen-turbo-latest': {
            apiKey: process.env.ALIYUN_API_KEY || '',
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            model: 'qwen-plus',
            maxTokens: 8191,
            temperatureRange: {
                min: 0,
                max: 1
            }
        },
        'alideepseekv3': {
            apiKey: process.env.ALIYUN_API_KEY || '',
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            model: 'deepseek-v3',
            maxTokens: 8191,
            temperatureRange: {
                min: 0,
                max: 2.0
            }
        },
        'alideepseekr1': {
            apiKey: process.env.ALIYUN_API_KEY || '',
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            model: 'deepseek-r1',
            maxTokens: 4191,
            temperatureRange: {
                min: 0,
                max: 1.0
            }
        },
        'volcesDeepseek': {
            apiKey: process.env.VOLCES_API_KEY || '',
            url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            model: 'ep-20250212110141-mvgts',
            maxTokens: 8096,
            temperatureRange: {
                min: 0,
                max: 1.0
            }
        },
        'volcesDeepseekR1': {
            apiKey: process.env.VOLCES_API_KEY || '',
            url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            model: 'ep-20250215224020-9nkj4',
            maxTokens: 8096,
            temperatureRange: {
                min: 0,
                max: 1.0
            }
        },
        'tencentDeepseek': {
            apiKey: process.env.TENCENT_API_KEY || '',
            url: 'https://api.lkeap.cloud.tencent.com/v1/chat/completions',
            model: 'deepseek-v3',
            maxTokens: 4096,
            temperatureRange: {
                min: 0,
                max: 1.0
            }
        },
        'minimax-text': {
            apiKey: process.env.MINIMAX_API_KEY || '',
            url: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
            model: 'abab5.5-chat',
            maxTokens: 8096,
            temperatureRange: {
                min: 0,
                max: 1.0
            }
        }
    };
}

// 初始化配置
API_CONFIGS = createConfigs();

class ModelService {
    private static instance: ModelService;
    private currentModel: ModelType = 'kimi';
    private currentTemperature: number = 0.7;

    private constructor() {
        // 初始化时创建配置
        API_CONFIGS = createConfigs();
    }

    public reloadConfig(): void {
        console.log('[ModelService] Reloading config with environment variables status:', {
            DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'exists' : 'missing',
            SILICON_DEEPSEEK_API_KEY: process.env.SILICON_DEEPSEEK_API_KEY ? 'exists' : 'missing',
            KIMI_API_KEY: process.env.KIMI_API_KEY ? 'exists' : 'missing',
            YIWAN_API_KEY: process.env.YIWAN_API_KEY ? 'exists' : 'missing',
            BAIDU_API_KEY: process.env.BAIDU_API_KEY ? 'exists' : 'missing',
            ALIYUN_API_KEY: process.env.ALIYUN_API_KEY ? 'exists' : 'missing',
            VOLCES_API_KEY: process.env.VOLCES_API_KEY ? 'exists' : 'missing',
            TENCENT_API_KEY: process.env.TENCENT_API_KEY ? 'exists' : 'missing',
            MINIMAX_API_KEY: process.env.MINIMAX_API_KEY ? 'exists' : 'missing'
        });
        API_CONFIGS = createConfigs();
    }

    public static getInstance(): ModelService {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }

    public getConfig(model: ModelType): ModelConfig {
        return API_CONFIGS[model];
    }

    public getAllConfigs(): Record<ModelType, ModelConfig> {
        return API_CONFIGS;
    }

    public getCurrentModel(): ModelType {
        return this.currentModel;
    }

    public setCurrentModel(model: ModelType): void {
        if (model in API_CONFIGS) {
            this.currentModel = model;
        }
    }

    public getCurrentTemperature(): number {
        return this.currentTemperature;
    }

    public setCurrentTemperature(temp: number): void {
        const config = this.getConfig(this.currentModel);
        if (temp >= config.temperatureRange.min && temp <= config.temperatureRange.max) {
            this.currentTemperature = temp;
        }
    }

    public getHeaders(model: ModelType): Record<string, string> {
        const config = this.getConfig(model);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // 不同模型需要不同的Authorization格式
        switch (model) {
            case 'kimi':
                // kimi需要sk-前缀，但env中已经包含了sk-前缀
                const kimiKey = config.apiKey.trim();
                headers['Authorization'] = `Bearer ${kimiKey}`;
                break;
            case 'yiwan':
                // yiwan不需要sk-前缀
                const yiwanKey = config.apiKey.replace(/^(Bearer\s+)?(sk-)?/, '');
                headers['Authorization'] = `Bearer ${yiwanKey}`;
                break;
            case 'baiduDeepseek':
                // 百度API使用原始格式
                headers['Authorization'] = `Bearer ${config.apiKey}`;
                break;
            case 'qwen-turbo-latest':
            case 'alideepseekv3':
            case 'alideepseekr1':
                // 阿里云API使用原始格式
                headers['Authorization'] = `Bearer ${config.apiKey}`;
                break;
            case 'volcesDeepseek':
            case 'volcesDeepseekR1':
                // 火山API使用原始格式
                headers['Authorization'] = `Bearer ${config.apiKey}`;
                break;
            case 'tencentDeepseek':
                // 腾讯云API使用原始格式
                headers['Authorization'] = `Bearer ${config.apiKey}`;
                break;
            case 'minimax-text':
                // MiniMax API使用原始格式
                headers['Authorization'] = `Bearer ${config.apiKey}`;
                break;
            default:
                // 其他模型使用标准Bearer token with sk-
                const standardKey = config.apiKey.replace(/^(Bearer\s+)?(sk-)?/, '');
                headers['Authorization'] = `Bearer sk-${standardKey}`;
        }

        return headers;
    }

    public validateTemperature(model: ModelType, temperature: number): number {
        const config = this.getConfig(model);
        return Math.max(
            config.temperatureRange.min,
            Math.min(config.temperatureRange.max, temperature)
        );
    }

    public estimateTokens(text: string): number {
        // 简单估算：平均每个字符占用0.25个token
        return Math.ceil(text.length * 0.25);
    }

    public calculateMaxTokens(model: ModelType, inputTokens: number): number {
        const config = this.getConfig(model);
        const reservedTokens = Math.ceil(config.maxTokens * 0.2); // 预留20%给响应
        return Math.max(100, config.maxTokens - inputTokens - reservedTokens);
    }
}

export default ModelService;
