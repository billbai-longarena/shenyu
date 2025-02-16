export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    name?: string;
}

export interface ChatHistory {
    id: number;
    title: string;
    messages: Message[];
}
