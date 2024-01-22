import { OpenAIMessage, getTextContentFromOpenAIMessageContent } from "../chat/types";
import { CoreBPE, RankMap } from "./bpe";
import ranks from './cl100k_base.json';

const special_tokens: any = {
    "<|endoftext|>": 100257,
    "<|fim_prefix|>": 100258,
    "<|fim_middle|>": 100259,
    "<|fim_suffix|>": 100260,
    "<|endofprompt|>": 100276,
};

const special_tokens_map = new Map<string, number>();
for (const text of Object.keys(special_tokens)) {
    special_tokens_map.set(text, special_tokens[text]);
}

const pattern = /('s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/giu;

const tokenizer = new CoreBPE(RankMap.from(ranks), special_tokens_map, pattern);

const overheadTokens = {
    perMessage: 5,
    perPrompt: 2,
}

const tokenCache = new Map<string, number>();

export function countTokensForText(text: string) {
    const cacheKey = text;
    if (tokenCache.has(cacheKey)) {
        return tokenCache.get(cacheKey)!;
    }
    let t1 = Date.now();
    const tokens = tokenizer.encodeOrdinary(text).length;
    tokenCache.set(cacheKey, tokens);
    return tokens;
}

export function countTokensForMessage(message: OpenAIMessage) {
    const text = getTextContentFromOpenAIMessageContent(message.content);
    return countTokensForText(text) + overheadTokens.perMessage;
}

export function countTokensForMessages(messages: OpenAIMessage[]) {
    let tokens = overheadTokens.perPrompt;
    for (const m of messages) {
        tokens += countTokensForMessage(m);
    }
    return tokens;
}

export function truncateText(text: string, tokens: number) {
    const encoded = tokenizer.encodeOrdinary(text);
    const decoded = tokenizer.decodeBytes(encoded.slice(0, Math.max(0, tokens)));
    return new TextDecoder().decode(decoded);
}

export function truncateMessage(message: OpenAIMessage, tokens: number) {
    const text = getTextContentFromOpenAIMessageContent(message.content);
    const encoded = tokenizer.encodeOrdinary(text);
    const decoded = tokenizer.decodeBytes(encoded.slice(0, Math.max(0, tokens - overheadTokens.perMessage)));
    const truncatedText = new TextDecoder().decode(decoded);

    if (Array.isArray(message.content) && message.content.length > 0) {
        const truncatedContent = JSON.parse(JSON.stringify(message.content));
        if ('text' in truncatedContent[0]) {
            // Update the text field of the first text content item with the truncated text, if it exists.
            // Note: The first item will always be a text field, and following items may be images.
            truncatedContent[0].text = truncatedText
        }
        return {
            ...message,
            content: truncatedContent,
        }
    } else {
        return {
            ...message,
            content: truncatedText,
        };
    }
}