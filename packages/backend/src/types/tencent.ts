export interface Message {
    Role: string;
    Content: string;
}

export interface ChatCompletionsRequest {
    Model: string;
    Messages: Message[];
    MaxTokens: number;
    Stream: boolean;
    Temperature: number;
}

export interface Choice {
    Message?: {
        Content?: string;
    };
    Delta?: {
        Content?: string;
    };
}

export interface ChatCompletionsResponse {
    Response?: {
        Choices?: Choice[];
        RequestId?: string;
    };
}

export interface StreamResponse extends ChatCompletionsResponse {
    on: (event: string, callback: (data: any) => void) => void;
}
