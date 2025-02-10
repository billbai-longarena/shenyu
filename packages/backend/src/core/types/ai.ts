import { Message, ModelType } from '../../types/api.js';

export interface StreamHandler {
    onChunk: (chunk: string) => void;
    onError: (error: string) => void;
    onComplete: () => void;
}

export interface AIProvider {
    streamRequest(
        sessionId: string,
        model: ModelType,
        messages: Message[],
        temperature: number,
        max_tokens: number,
        handler: StreamHandler
    ): Promise<void>;
}

export interface APIErrorDetails {
    status: number;
    statusText: string;
    errorBody: string;
    model: ModelType;
    promptLength: number;
    tokensEstimate: number;
}
