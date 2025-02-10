import { Message, ModelType } from '../../types/api.js';
import { AIProvider, StreamHandler } from '../types/ai.js';
import { HttpAIService } from '../../plugins/http/http-ai-service.js';

class AIService implements AIProvider {
    private static instance: AIService;
    private httpService: HttpAIService;

    private constructor() {
        this.httpService = new HttpAIService();
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    public async streamRequest(
        sessionId: string,
        model: ModelType,
        messages: Message[],
        temperature: number,
        max_tokens: number,
        handler: StreamHandler
    ): Promise<void> {
        await this.httpService.streamRequest(
            sessionId,
            model,
            messages,
            temperature,
            max_tokens,
            handler
        );
    }
}

export default AIService;
