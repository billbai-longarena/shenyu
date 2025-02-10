export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatHistory {
    id: number;
    title: string;
    messages: Message[];
}
