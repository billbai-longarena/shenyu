import WebSocket from 'ws';

const models = [
    { label: 'kimi', value: 'kimi' },
    { label: '腾讯云DeepSeekv3', value: 'tencentDeepseek' },
    { label: 'deepseek V3', value: 'deepseek' },
    { label: '零一万物', value: 'yiwan' },
    { label: '硅基流动DeepseekV3', value: 'siliconDeepseek' },
    { label: '百度DeepSeekV3', value: 'baiduDeepseek' },
    { label: 'Qwen 2.5 Plus', value: 'qwen-turbo-latest' },
    { label: 'Ali DeepSeekV3', value: 'alideepseekv3' },
    { label: 'Ali DeepSeek R1', value: 'alideepseekr1' }
];

// 测试单个模型
async function testModel(model, mode = 'serial') {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3001');
        const startTime = Date.now();
        let firstResponseTime = null;
        let chunks = [];
        let timeoutId = null;

        ws.on('open', () => {
            console.log(`[${mode}] 开始测试模型 ${model.label}`);
            
            const request = {
                type: 'stream',
                model: model.value,
                messages: [{ role: 'user', content: '你好' }],
                temperature: 0.7,
                max_tokens: 100,
                mode: 'speed_test'
            };
            
            ws.send(JSON.stringify(request));

            // 设置30秒超时
            timeoutId = setTimeout(() => {
                ws.close();
                reject(new Error('Request timeout'));
            }, 30000);
        });

        ws.on('message', (data) => {
            const response = JSON.parse(data.toString());
            
            if (response.type === 'chunk') {
                if (!firstResponseTime) {
                    firstResponseTime = Date.now();
                    console.log(`[${mode}] ${model.label} 首次响应时间: ${firstResponseTime - startTime}ms`);
                }
                chunks.push(response.content);
            }
            else if (response.type === 'complete') {
                clearTimeout(timeoutId);
                const endTime = Date.now();
                const totalContent = chunks.join('');
                const result = {
                    model: model.label,
                    firstResponseDelay: firstResponseTime - startTime,
                    totalTime: endTime - startTime,
                    responseLength: totalContent.length,
                    tokensPerSecond: (totalContent.length / 4) / ((endTime - firstResponseTime) / 1000)
                };
                console.log(`[${mode}] ${model.label} 测试完成:`, result);
                ws.close();
                resolve(result);
            }
            else if (response.type === 'error') {
                clearTimeout(timeoutId);
                ws.close();
                reject(new Error(response.message));
            }
        });

        ws.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
        });
    });
}

// 串行测试所有模型
async function runSerialTests() {
    console.log('\n=== 开始串行测试 ===\n');
    const results = [];
    
    for (const model of models) {
        try {
            const result = await testModel(model, 'serial');
            results.push(result);
            // 每个测试之间等待2秒
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`[serial] ${model.label} 测试失败:`, error);
            results.push({
                model: model.label,
                error: error.message
            });
        }
    }
    
    return results;
}

// 并行测试所有模型
async function runParallelTests() {
    console.log('\n=== 开始并行测试 ===\n');
    const promises = models.map(model => testModel(model, 'parallel'));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            return {
                model: models[index].label,
                error: result.reason.message
            };
        }
    });
}

// 运行测试并输出报告
async function runTests() {
    try {
        // 串行测试
        const serialResults = await runSerialTests();
        console.log('\n=== 串行测试结果 ===\n');
        console.table(serialResults);
        
        // 等待10秒后开始并行测试
        console.log('\n等待10秒后开始并行测试...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 并行测试
        const parallelResults = await runParallelTests();
        console.log('\n=== 并行测试结果 ===\n');
        console.table(parallelResults);
        
        // 对比分析
        console.log('\n=== 性能对比分析 ===\n');
        models.forEach(model => {
            const serial = serialResults.find(r => r.model === model.label);
            const parallel = parallelResults.find(r => r.model === model.label);
            
            console.log(`\n${model.label}:`);
            if (!serial.error && !parallel.error) {
                const speedDiff = ((parallel.tokensPerSecond - serial.tokensPerSecond) / serial.tokensPerSecond * 100).toFixed(2);
                const delayDiff = ((parallel.firstResponseDelay - serial.firstResponseDelay) / serial.firstResponseDelay * 100).toFixed(2);
                
                console.log(`- Token速度变化: ${speedDiff}%`);
                console.log(`- 首次响应延迟变化: ${delayDiff}%`);
            } else {
                if (serial.error) console.log(`- 串行测试失败: ${serial.error}`);
                if (parallel.error) console.log(`- 并行测试失败: ${parallel.error}`);
            }
        });
        
    } catch (error) {
        console.error('测试过程出错:', error);
    }
}

// 运行测试
runTests().catch(console.error);
