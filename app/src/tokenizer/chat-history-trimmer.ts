import { OpenAIMessage } from '../types';
import * as tokenizer from '.';

export interface ChatHistoryTrimmerOptions {
    maxTokens: number,
    nMostRecentMessages?: number,
    preserveSystemPrompt: boolean,
    preserveFirstUserMessage: boolean,
}

export class ChatHistoryTrimmer {
    private output: OpenAIMessage[] = [];

    constructor(private messages: OpenAIMessage[],
                private readonly options: ChatHistoryTrimmerOptions) {
    }

    private countExcessTokens() {
        return Math.max(0, tokenizer.countTokensForMessages(this.output) - this.options.maxTokens);
    }

    public process() {
        this.output = this.messages.map(m => ({ ...m }));

        if (this.options.nMostRecentMessages) {
            this.output = this.removeUnwantedMessagesStrategy();
        }

        let excessTokens = this.countExcessTokens();

        if (excessTokens === 0) {
            return this.output;
        }

        this.output = this.removeMessagesStrategy();

        excessTokens = this.countExcessTokens();
        if (excessTokens === 0) {
            return this.output;
        }

        this.output = this.trimMessagesStrategy(excessTokens);

        excessTokens = this.countExcessTokens();
        if (excessTokens === 0) {
            return this.output;
        }

        const last = this.messages[this.messages.length - 1];
        this.output = [
            tokenizer.truncateMessage(last, this.options.maxTokens),
        ]

        return this.output;
    }
    
    private removeUnwantedMessagesStrategy() {
        const systemPromptIndex = this.messages.findIndex(m => m.role === 'system');
        const firstUserMessageIndex = this.messages.findIndex(m => m.role === 'user');
        const keepFromIndex = this.messages.length - (this.options.nMostRecentMessages || 1);

        const output: OpenAIMessage[] = [];

        for (let i = 0; i < this.output.length; i++) {
            if (i === systemPromptIndex && this.options.preserveSystemPrompt) {
                output.push(this.output[i]);
            } else if (i === firstUserMessageIndex && this.options.preserveFirstUserMessage) {
                output.push(this.output[i]);
            } else if (i >= keepFromIndex) {
                output.push(this.output[i]);
            }
        }

        return output;
    }

    private removeMessagesStrategy() {
        const systemPromptIndex = this.messages.findIndex(m => m.role === 'system');
        const firstUserMessageIndex = this.messages.findIndex(m => m.role === 'user');
        const lastMessageIndex = this.messages.length - 1;

        const output: OpenAIMessage[] = [...this.output];

        for (let i = 0; i < this.output.length && tokenizer.countTokensForMessages(output) > this.options.maxTokens; i++) {
            if (i == lastMessageIndex) {
                continue;
            }
            if (i !== systemPromptIndex && !this.options.preserveSystemPrompt) {
                continue;
            }
            if (i !== firstUserMessageIndex && this.options.preserveFirstUserMessage) {
                continue;
            }
            output[i].content = '';
        }

        return output.filter(m => m.content.length > 0);
    }

    private trimMessagesStrategy(excessTokens: number) {
        const systemPromptIndex = this.output.findIndex(m => m.role === 'system');
        const firstUserMessageIndex = this.output.findIndex(m => m.role === 'user');
        const lastMessageIndex = this.output.length - 1;

        const output: OpenAIMessage[] = [...this.output];
        const truncateLength = Math.floor(excessTokens /  this.output.length);

        for (let i = 0; i < this.output.length && tokenizer.countTokensForMessages(output) > this.options.maxTokens; i++) {
            if (i === lastMessageIndex) {
                continue;
            }
            if (i === systemPromptIndex && this.options.preserveSystemPrompt) {
                continue;
            }
            if (i === firstUserMessageIndex && this.options.preserveFirstUserMessage) {
                continue;
            }
            output[i] = tokenizer.truncateMessage(output[i], truncateLength);
        }
        return output.filter(m => m.content.length > 0);
    }
}