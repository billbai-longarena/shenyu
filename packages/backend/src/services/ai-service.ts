import { Message, ModelType } from '../types/api.js';
import ModelService from './model-service.js';
import SessionService from './session-service.js';
import fetch, { Response } from 'node-fetch';
import { TextDecoder } from 'node:util';

export interface StreamHandler {
    onChunk: (chunk: string) => void;
    onError: (error: string) => void;
    onComplete: () => void;
}

class AIService {
    private static instance: AIService;
    private modelService: ModelService;
    private sessionService: SessionService;

    private constructor() {
        this.modelService = ModelService.getInstance();
        this.sessionService = SessionService.getInstance();
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    private async handleApiError(
        status: number,
        statusText: string,
        errorText: string,
        model: ModelType,
        prompt: string
    ): Promise<string> {
        console.error('API Error Details:', {
            status,
            statusText,
            errorBody: errorText,
            model,
            promptLength: prompt.length,
            tokensEstimate: Math.ceil(prompt.length / 4)
        });

        let errorMessage = `API request failed (${status}): ${statusText}`;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
                errorMessage += ` - ${errorJson.error.type || ''}: ${errorJson.error.message || ''}`;
            }
        } catch (e) {
            errorMessage += ` - ${errorText}`;
        }
        return errorMessage;
    }

    public async streamRequest(
        sessionId: string,
        model: ModelType,
        messages: Message[],
        temperature: number,
        max_tokens: number,
        handler: StreamHandler
    ): Promise<void> {
        const modelConfig = this.modelService.getConfig(model);

        // 测速模式使用特定前缀
        if (sessionId.startsWith('speed_test_')) {
            console.log('[AIService] Speed test mode, skipping session check');
        } else {
            const session = this.sessionService.getSession(sessionId);
            if (!session) {
                handler.onError('Session not found');
                return;
            }
        }

        try {
            // 获取最新的headers
            const headers = this.modelService.getHeaders(model);
            const config = this.modelService.getConfig(model);
            console.log('[AIService] Debug Info:', {
                model,
                apiKey: config.apiKey ? 'exists' : 'missing',
                apiKeyLength: config.apiKey?.length,
                headers: {
                    ...headers,
                    Authorization: headers.Authorization?.replace(/Bearer\s+[^\s]+/, 'Bearer ***')
                },
                url: modelConfig.url,
                modelName: modelConfig.model
            });

            // 验证headers
            if (!headers.Authorization || headers.Authorization === 'Bearer ') {
                throw new Error('Missing or invalid Authorization header');
            }

            // 标准API处理
            const response = await fetch(modelConfig.url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: modelConfig.model,
                    messages,
                    stream: true,
                    temperature: this.modelService.validateTemperature(model, temperature),
                    max_tokens: max_tokens
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = await this.handleApiError(
                    response.status,
                    response.statusText,
                    errorText,
                    model,
                    JSON.stringify(messages)
                );
                handler.onError(errorMessage);
                return;
            }

            if (!response.body) {
                handler.onError('Response body is null');
                return;
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let currentPosition = 0;

            try {
                for await (const chunk of response.body) {
                    buffer += decoder.decode(chunk as Buffer, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const content = line.slice(6).trim();
                            if (content === '[DONE]') continue;

                            try {
                                const data = JSON.parse(content);
                                const chunk = data.choices?.[0]?.delta?.content;
                                if (chunk) {
                                    currentPosition += chunk.length;
                                    if (!sessionId.includes('speed_test')) {
                                        this.sessionService.updateStreamPosition(sessionId, currentPosition);
                                    }
                                    handler.onChunk(chunk);
                                }
                            } catch (error) {
                                console.error('Error parsing stream data:', error);
                                continue;
                            }
                        }
                    }
                }
            } finally {
                handler.onComplete();
            }
        } catch (error) {
            console.error('Error in streamRequest:', error);
            handler.onError(error instanceof Error ? error.message : 'Unknown error');
        }
    }
}

export default AIService;
