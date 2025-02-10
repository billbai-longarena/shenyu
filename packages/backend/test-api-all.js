import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { TextDecoder } from 'util';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '.env') });

// API配置
const API_CONFIGS = {
    kimi: {
        apiKey: process.env.KIMI_API_KEY,
        url: 'https://api.moonshot.cn/v1/chat/completions',
        model: 'moonshot-v1-8k',
    },
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        url: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
    },
    yiwan: {
        apiKey: process.env.YIWAN_API_KEY,
        url: 'https://api.lingyiwanwu.com/v1/chat/completions',
        model: 'yi-lightning',
    },
    siliconDeepseek: {
        apiKey: process.env.SILICON_DEEPSEEK_API_KEY,
        url: 'https://api.siliconflow.cn/v1/chat/completions',
        model: 'deepseek-ai/DeepSeek-V3',
    },
    baiduDeepseek: {
        apiKey: process.env.BAIDU_API_KEY,
        url: 'https://qianfan.baidubce.com/v2/chat/completions',
        model: 'deepseek-v3',
    },
    'qwen-turbo-latest': {
        apiKey: process.env.ALIYUN_API_KEY,
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: 'qwen-plus',
    },
    alideepseekv3: {
        apiKey: process.env.ALIYUN_API_KEY,
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: 'deepseek-v3',
    },
    alideepseekr1: {
        apiKey: process.env.ALIYUN_API_KEY,
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: 'deepseek-r1',
    }
};

// 获取正确的Authorization header
function getHeaders(model, apiKey) {
    const headers = {
        'Content-Type': 'application/json'
    };

    switch (model) {
        case 'kimi':
            // kimi需要sk-前缀
            const kimiKey = apiKey.replace(/^(Bearer\s+)?(sk-)?/, '');
            headers['Authorization'] = `Bearer sk-${kimiKey}`;
            break;
        case 'yiwan':
            // yiwan不需要sk-前缀
            const yiwanKey = apiKey.replace(/^(Bearer\s+)?(sk-)?/, '');
            headers['Authorization'] = `Bearer ${yiwanKey}`;
            break;
        case 'baiduDeepseek':
            headers['Authorization'] = `Bearer ${apiKey}`;
            break;
        case 'qwen-turbo-latest':
        case 'alideepseekv3':
        case 'alideepseekr1':
            headers['Authorization'] = `Bearer ${apiKey}`;
            break;
        default:
            // 其他模型使用标准Bearer token
            const standardKey = apiKey.replace(/^(Bearer\s+)?(sk-)?/, '');
            headers['Authorization'] = `Bearer sk-${standardKey}`;
    }

    return headers;
}

// 测试单个API
async function testAPI(modelName) {
    const config = API_CONFIGS[modelName];
    if (!config) {
        console.error(`[${modelName}] 配置未找到`);
        return false;
    }

    if (!config.apiKey) {
        console.error(`[${modelName}] API密钥未设置`);
        return false;
    }

    console.log(`\n开始测试 ${modelName}...`);
    console.log('URL:', config.url);
    console.log('Model:', config.model);

    const headers = getHeaders(modelName, config.apiKey);
    console.log('Headers:', JSON.stringify(headers, null, 2));

    const body = {
        model: config.model,
        messages: [{ role: 'user', content: '你好' }],
        stream: true,
        temperature: 0.7,
        max_tokens: 100
    };

    try {
        const response = await fetch(config.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[${modelName}] 请求失败:`, {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                headers: headers,
                requestBody: body
            });
            return false;
        }

        if (!response.body) {
            console.error(`[${modelName}] 响应体为空`);
            return false;
        }

        console.log(`[${modelName}] 连接成功，开始接收响应...`);

        const decoder = new TextDecoder();
        let buffer = '';
        let receivedResponse = false;

        for await (const chunk of response.body) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const content = line.slice(6).trim();
                    if (content === '[DONE]') continue;

                    try {
                        const data = JSON.parse(content);
                        const text = data.choices?.[0]?.delta?.content;
                        if (text) {
                            if (!receivedResponse) {
                                console.log(`[${modelName}] 收到首个响应`);
                                receivedResponse = true;
                            }
                        }
                    } catch (error) {
                        console.warn(`[${modelName}] 解析响应出错:`, error);
                    }
                }
            }
        }

        if (receivedResponse) {
            console.log(`[${modelName}] 测试成功！`);
            return true;
        } else {
            console.error(`[${modelName}] 未收到有效响应`);
            return false;
        }

    } catch (error) {
        console.error(`[${modelName}] 请求出错:`, error);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('开始API测试...\n');

    const results = new Map();
    // 只测试KIMI
    const success = await testAPI('kimi');
    results.set('kimi', success);

    console.log('\n测试结果汇总:');
    console.log('=================');
    for (const [model, success] of results) {
        console.log(`${model}: ${success ? '✅ 成功' : '❌ 失败'}`);
    }
}

// 执行测试
runAllTests().catch(console.error);
