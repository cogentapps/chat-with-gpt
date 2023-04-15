import * as methods from ".";
import { OpenAIMessage } from "../chat/types";
import { ChatHistoryTrimmer, ChatHistoryTrimmerOptions } from "./chat-history-trimmer";

export function runChatTrimmer(messages: OpenAIMessage[], options: ChatHistoryTrimmerOptions) {
    const trimmer = new ChatHistoryTrimmer(messages, options);
    return trimmer.process();
}

export function countTokensForText(text: string) {
    return methods.countTokensForText(text);
}

export function countTokensForMessages(messages: OpenAIMessage[]) {
    return methods.countTokensForMessages(messages);
}