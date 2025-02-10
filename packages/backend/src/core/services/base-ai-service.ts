import { Message, ModelType } from '../../types/api.js';
import { AIProvider, StreamHandler } from '../types/ai.js';
import ModelService from '../../services/model-service.js';
import SessionService from '../../services/session-service.js';

export abstract class BaseAIService implements AIProvider {
    protected modelService: ModelService;
    protected sessionService: SessionService;

    constructor() {
        this.modelService = ModelService.getInstance();
        this.sessionService = SessionService.getInstance();
    }

    protected validateSession(sessionId: string): boolean {
        // 测速模式使用特定前缀
        if (sessionId.startsWith('speed_test_')) {
            console.log('[AIService] Speed test mode, skipping session check');
            return true;
        }

        const session = this.sessionService.getSession(sessionId);
        return !!session;
    }

    protected updateStreamPosition(sessionId: string, position: number): void {
        if (!sessionId.includes('speed_test')) {
            this.sessionService.updateStreamPosition(sessionId, position);
        }
    }

    abstract streamRequest(
        sessionId: string,
        model: ModelType,
        messages: Message[],
        temperature: number,
        max_tokens: number,
        handler: StreamHandler
    ): Promise<void>;
}
