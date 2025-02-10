import { Message, ModelType, ContentItem } from '../../types/api.js';
import { StreamHandler } from '../../core/types/ai.js';
import { BaseAIService } from '../../core/services/base-ai-service.js';

export class MockAIService extends BaseAIService {
    private mockResponses: { [key: string]: string } = {
        default: "这是一个模拟响应。The quick brown fox jumps over the lazy dog.",
        greeting: "你好！Hello! 这是一个测试响应。",
        error: "模拟错误响应"
    };

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getMessageContent(content: string | ContentItem[]): string {
        if (typeof content === 'string') {
            return content;
        }
        return content
            .filter(item => item.type === 'text' && item.text)
            .map(item => item.text!)
            .join(' ');
    }

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
            // 选择响应内容
            const lastMessage = messages[messages.length - 1];
            const lastMessageContent = this.getMessageContent(lastMessage.content).toLowerCase();
            let response = this.mockResponses.default;

            if (lastMessageContent.includes('hello') || lastMessageContent.includes('hi') ||
                lastMessageContent.includes('你好')) {
                response = this.mockResponses.greeting;
            } else if (lastMessageContent.includes('error') || lastMessageContent.includes('错误')) {
                throw new Error(this.mockResponses.error);
            }

            // 模拟流式响应
            const chunks = response.split(' ');
            let currentPosition = 0;

            for (const chunk of chunks) {
                await this.delay(200); // 模拟网络延迟
                const chunkWithSpace = chunk + ' ';
                currentPosition += chunkWithSpace.length;
                this.updateStreamPosition(sessionId, currentPosition);
                handler.onChunk(chunkWithSpace);
            }

            handler.onComplete();
        } catch (error) {
            console.error('Error in mock streamRequest:', error);
            handler.onError(error instanceof Error ? error.message : 'Unknown error');
        }
    }
}
