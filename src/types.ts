import { MessageTree } from "./message-tree";

export interface Parameters {
    temperature: number;
    apiKey?: string;
    initialSystemPrompt?: string;
}

export interface Message {
    id: string;
    chatID: string;
    parentID?: string;
    timestamp: number;
    role: string;
    content: string;
    parameters?: Parameters;
    done?: boolean;
}

export interface UserSubmittedMessage {
    chatID: string;
    parentID?: string;
    content: string;
    requestedParameters: Parameters;
}

export interface OpenAIMessage {
    role: string;
    content: string;
}

export function getOpenAIMessageFromMessage(message: Message): OpenAIMessage {
    return {
        role: message.role,
        content: message.content,
    };
}

export interface Chat {
    id: string;
    messages: MessageTree;
    title?: string | null;
    created: number;
    updated: number;
}