import fetch from 'node-fetch';

interface OcrResult {
    log_id: number;
    words_result_num: number;
    words_result: Array<{
        words: string;
    }>;
    error_code?: number;
    error_msg?: string;
}

interface ParseResult {
    pages: Array<{
        text?: string;
        tables?: Array<{
            markdown?: string;
        }>;
    }>;
}

interface QueryResult {
    error_code: number;
    error_msg: string;
    result: {
        status: 'success' | 'failed' | 'pending' | 'processing' | 'running';
        task_error?: string;
        parse_result_url?: string;
    };
}

class DocumentService {
    private static instance: DocumentService;
    private accessToken: string | null = null;
    private tokenExpireTime: number = 0;

    private constructor() { }

    public static getInstance(): DocumentService {
        if (!DocumentService.instance) {
            DocumentService.instance = new DocumentService();
        }
        return DocumentService.instance;
    }

    private async getAccessToken(): Promise<string> {
        const API_KEY = process.env.BAIDU_API_KEY;
        const SECRET_KEY = process.env.BAIDU_SECRET_KEY;

        if (!API_KEY || !SECRET_KEY) {
            throw new Error('百度API的密钥未配置，请检查环境变量 BAIDU_API_KEY 和 BAIDU_SECRET_KEY');
        }

        // 如果token还在有效期内，直接返回
        if (this.accessToken && Date.now() < this.tokenExpireTime) {
            return this.accessToken;
        }

        try {
            const response = await fetch(
                `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('获取access token失败');
            }

            const data = await response.json() as { access_token: string; expires_in: number };
            this.accessToken = data.access_token;
            // 提前5分钟过期以确保安全
            this.tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;

            return this.accessToken;
        } catch (error) {
            console.error('获取access token错误:', error);
            throw new Error('获取access token失败');
        }
    }

    private async submitParseTask(accessToken: string, fileData: string, fileName: string): Promise<string> {
        try {
            console.log('[Document] 提交解析任务:', {
                fileName,
                fileDataLength: fileData.length,
                timestamp: new Date().toISOString()
            });

            const response = await fetch(
                `https://aip.baidubce.com/rest/2.0/brain/online/v2/parser/task?access_token=${accessToken}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        file_data: fileData,
                        file_name: fileName
                    })
                }
            );

            const responseText = await response.text();
            console.log('[Document] API响应:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText,
                timestamp: new Date().toISOString()
            });

            if (!response.ok) {
                throw new Error(`提交解析任务失败: ${response.status} ${response.statusText} - ${responseText}`);
            }

            const data = JSON.parse(responseText) as { error_code: number; error_msg: string; result: { task_id: string } };

            if (data.error_code !== 0) {
                throw new Error(`API错误: ${data.error_msg}`);
            }

            return data.result.task_id;
        } catch (error) {
            console.error('提交解析任务错误:', error);
            throw new Error('提交解析任务失败');
        }
    }

    private async queryParseResult(accessToken: string, taskId: string): Promise<QueryResult['result']> {
        try {
            const response = await fetch(
                `https://aip.baidubce.com/rest/2.0/brain/online/v2/parser/task/query?access_token=${accessToken}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        task_id: taskId
                    })
                }
            );

            if (!response.ok) {
                throw new Error('查询解析结果失败');
            }

            const data = await response.json() as QueryResult;
            if (data.error_code !== 0) {
                throw new Error(`API错误: ${data.error_msg}`);
            }

            return data.result;
        } catch (error) {
            console.error('查询解析结果错误:', error);
            throw new Error('查询解析结果失败');
        }
    }

    private async recognizeContent(fileData: string, fileName: string): Promise<string> {
        try {
            const accessToken = await this.getAccessToken();

            // 确保base64字符串不包含前缀
            const base64Data = fileData.includes(',') ?
                fileData.split(',')[1] : fileData;

            // 对base64进行urlencode
            const encodedData = encodeURIComponent(base64Data);

            // 设置OCR请求参数
            const requestParams = new URLSearchParams({
                image: encodedData,
                detect_direction: 'false',
                detect_language: 'false',
                paragraph: 'false',
                probability: 'false'
            });

            console.log('[OCR] 准备发送请求:', {
                url: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
                hasAccessToken: !!accessToken,
                hasApiKey: !!process.env.BAIDU_API_KEY,
                hasSecretKey: !!process.env.BAIDU_SECRET_KEY,
                fileName,
                dataLength: encodedData.length,
                params: Object.fromEntries(requestParams),
                timestamp: new Date().toISOString()
            });

            const response = await fetch(
                `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    body: requestParams
                }
            );

            const responseText = await response.text();
            console.log('[OCR] API响应:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText,
                timestamp: new Date().toISOString()
            });

            const data = JSON.parse(responseText) as OcrResult;

            if (!response.ok || (data.error_code && data.error_code !== 0)) {
                console.error('[OCR] 错误详情:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorCode: data.error_code,
                    errorMsg: data.error_msg,
                    responseBody: responseText
                });
                throw new Error(data.error_msg || `OCR识别请求失败: ${response.status} ${response.statusText}`);
            }
            if (!data.words_result || !Array.isArray(data.words_result)) {
                throw new Error('OCR识别结果格式错误');
            }

            return data.words_result.map(result => result.words).join('\n');
        } catch (error) {
            console.error('OCR识别错误:', error);
            throw new Error('OCR识别失败');
        }
    }

    public async parseDocument(fileData: string, fileName: string, progressCallback: (status: string) => void, useLocalOcr: boolean = false): Promise<string> {
        try {
            if (useLocalOcr) {
                progressCallback('正在进行OCR识别');
                return await this.recognizeContent(fileData, fileName);
            }

            // 使用文档解析API
            const accessToken = await this.getAccessToken();
            progressCallback('获取access token成功');

            // 提交解析任务
            const taskId = await this.submitParseTask(accessToken, fileData, fileName);
            progressCallback('提交解析任务成功');

            // 轮询获取结果
            let attempts = 0;
            const maxAttempts = 12; // 最多轮询1分钟

            while (attempts < maxAttempts) {
                const result = await this.queryParseResult(accessToken, taskId);

                switch (result.status) {
                    case 'success':
                        progressCallback('解析完成，正在下载结果');
                        // 下载并解析结果
                        if (!result.parse_result_url) {
                            throw new Error('解析结果URL不存在');
                        }
                        const response = await fetch(result.parse_result_url);
                        if (!response.ok) {
                            throw new Error('下载解析结果失败');
                        }
                        const parseResult = await response.json() as ParseResult;

                        // 提取文本
                        let text = '';
                        for (const page of parseResult.pages) {
                            if (page.text) {
                                text += page.text + '\n';
                            }
                            if (page.tables) {
                                for (const table of page.tables) {
                                    if (table.markdown) {
                                        text += table.markdown + '\n';
                                    }
                                }
                            }
                        }
                        return text.trim();

                    case 'failed':
                        throw new Error(`解析失败: ${result.task_error || '未知错误'}`);

                    case 'pending':
                    case 'processing':
                    case 'running':
                        progressCallback(`正在解析中(${attempts + 1}/${maxAttempts})`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        attempts++;
                        continue;

                    default:
                        throw new Error(`未知状态: ${result.status}`);
                }
            }

            throw new Error('解析超时');
        } catch (error) {
            console.error('文档解析错误:', error);
            throw error;
        }
    }
}

export default DocumentService;
