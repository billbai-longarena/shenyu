import { Message, ModelType } from '../../types/api.js';
import { StreamHandler } from '../../core/types/ai.js';
import { BaseAIService } from '../../core/services/base-ai-service.js';
import { handleApiError } from '../../core/utils/api-error.js';
import fetch from 'node-fetch';
import { TextDecoder } from 'node:util';

export class HttpAIService extends BaseAIService {
    public async streamRequest(
        sessionId: string,
        model: ModelType,
        messages: Message[],
        temperature: number,
        max_tokens: number,
        handler: StreamHandler
    ): Promise<void> {
        if (!this.validateSession(sessionId)) {
            handler.onError('Session not found');
            return;
        }

        try {
            const modelConfig = this.modelService.getConfig(model);
            const response = await fetch(modelConfig.url, {
                method: 'POST',
                headers: this.modelService.getHeaders(model),
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
                const errorMessage = await handleApiError(
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
                                    this.updateStreamPosition(sessionId, currentPosition);
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
