export type ModelType = 'deepseek' | 'kimi' | 'yiwan' | 'siliconDeepseek' | 'baiduDeepseek' | 'qwen-turbo-latest' | 'alideepseekv3' | 'alideepseekr1' | 'volcesDeepseek' | 'volcesDeepseekR1' | 'tencentDeepseek' | 'minimax-text';

export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | ContentItem[];
    tool_call_id?: string;
    tool_calls?: Array<{
        id: string;
        type: string;
        function: {
            name: string;
            arguments: string;
        };
    }>;
}

export interface ContentItem {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
    };
}

export interface ApiResponse {
    choices?: Array<{
        delta?: {
            content?: string;
        };
    }>;
    error?: {
        message: string;
    };
}

export interface ChatRequest {
    model: string;
    messages: Message[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    stream_options?: {
        include_usage?: boolean;
    };
}

export interface ChatResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
            tool_calls?: Array<any>;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
}

export interface StreamResponse {
    choices: Array<{
        delta: {
            content?: string;
        };
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
}

export interface ErrorResponse {
    error: {
        message: string;
        type?: string;
        code?: string;
    };
}

export interface PageInfo {
    pageNumber: number;
    totalPages: number;
}

export interface ParseDocumentRequest {
    type: 'parseDocument';
    fileData: string;
    fileName: string;
    useLocalOcr?: boolean;
    pageInfo?: PageInfo;
}

export interface ParseProgressResponse {
    type: 'parseProgress';
    status: string;
}

export interface ParseResultResponse {
    type: 'parseResult';
    content: string;
    pageInfo?: PageInfo;
}

export interface ParseErrorResponse {
    type: 'parseError';
    error: string;
}

export type DocumentParseResponse = ParseProgressResponse | ParseResultResponse | ParseErrorResponse;
