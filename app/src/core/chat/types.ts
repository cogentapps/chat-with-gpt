import { MessageTree } from "./message-tree";

export interface Parameters {
    temperature: number;
    apiKey?: string;
    initialSystemPrompt?: string;
    model: string;
}

export type TextContentItem = {
    type: 'text';
    text: string;
}

export type ImageContentItem = {
    type: 'image_url';
    image_url: {
        url: string;
    };
};

export type ContentItem = TextContentItem | ImageContentItem;

export type MessageContent = string | ContentItem[];

export interface Message {
    id: string;
    chatID: string;
    parentID?: string;
    timestamp: number;
    role: string;
    model?: string;
    content: MessageContent;
    parameters?: Parameters;
    done?: boolean;
}

export interface UserSubmittedMessage {
    chatID: string;
    parentID?: string;
    content: MessageContent;
    requestedParameters: Parameters;
}

export interface OpenAIMessage {
    role: string;
    content: MessageContent;
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
    metadata?: Record<string, any>;
    pluginOptions?: Record<string, any>;
    title?: string | null;
    created: number;
    updated: number;
    deleted?: boolean;
}

export function serializeChat(chat: Chat): string {
    return JSON.stringify({
        ...chat,
        messages: chat.messages.serialize(),
    });
}

export function deserializeChat(serialized: string) {
    const chat = JSON.parse(serialized);
    chat.messages = new MessageTree(chat.messages);
    return chat as Chat;
}