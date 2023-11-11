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
    content: string;
    image_url?: string;
    parameters?: Parameters;
    done?: boolean;
}

export interface UserSubmittedMessage {
    chatID: string;
    parentID?: string;
    content: string;
    image_url?: string;
    requestedParameters: Parameters;
}

export interface OpenAIMessage {
    role: string;
    content: MessageContent;
}

export function convertOpenAIMessageContentToMessageContent(openAIMessageContent: MessageContent): string {
    if (typeof openAIMessageContent === 'string') {
        // The content is already a string, so return it as is.
        return openAIMessageContent;
    } else if (Array.isArray(openAIMessageContent) && openAIMessageContent.length > 0) {
        // The content is an array and we assume there's at least one item.
        // Directly access the text of the first (and supposedly only) TextContentItem.
        const firstItem = openAIMessageContent[0];
        if ('text' in firstItem) {
            return firstItem.text; // Assuming this is a TextContentItem with a 'text' field.
        }
    }
    // If the content is neither a string nor a valid array, return an empty string or handle as needed.
    return '';
}


export function getOpenAIMessageFromMessage(message: Message): OpenAIMessage {
    let contents: ContentItem[] = [];

    contents.push({
        type: 'text',
        text: message.content,
    });

    if (message.image_url) {
        contents.push({
            type: 'image_url',
            image_url: {
                url: message['image_url'],
            },
        });
    }

    return {
        role: message.role,
        content: contents,
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