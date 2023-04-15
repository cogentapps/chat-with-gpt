import Plugin from "../core/plugins";
import { PluginDescription } from "../core/plugins/plugin-description";
import { OpenAIMessage, Parameters } from "../core/chat/types";
import { countTokens, runChatTrimmer } from "../core/tokenizer/wrapper";
import { defaultModel } from "../core/chat/openai";

export const systemPrompt = `
Please read the following exchange and write a short, concise title describing the topic (in the user's language).
If there is no clear topic for the exchange, respond with: N/A
`.trim();

export const systemPromptForLongExchanges = `
Please read the following exchange and write a short, concise title describing the topic (in the user's language).
`.trim();

export interface TitlePluginOptions {
}

const userPrompt = (messages: OpenAIMessage[]) => {
    return messages.map(m => `${m.role.toLocaleUpperCase()}:\n${m.content}`)
        .join("\n===\n")
        + "\n===\nTitle:";
}

export class TitlePlugin extends Plugin<TitlePluginOptions> {
    describe(): PluginDescription {
        return {
            id: "titles",
            name: "Title Generator",
            options: [],
        };
    }

    async postprocessModelOutput(message: OpenAIMessage, contextMessages: OpenAIMessage[], parameters: Parameters, done: boolean): Promise<OpenAIMessage> {
        if (done && !this.context?.getCurrentChat().title) {
            (async () => {
                let messages = [
                    ...contextMessages.filter(m => m.role === 'user' || m.role === 'assistant'),
                    message,
                ];

                const tokens = await countTokens(messages);

                messages = await runChatTrimmer(messages, {
                    maxTokens: 1024,
                    preserveFirstUserMessage: true,
                    preserveSystemPrompt: false,
                });

                messages = [
                    {
                        role: 'system',
                        content: tokens.length > 512 ? systemPromptForLongExchanges : systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userPrompt(messages),
                    },
                ]

                const output = await this.context?.createChatCompletion(messages, {
                    model: defaultModel,
                    temperature: 0,
                });
                
                if (!output || output === 'N/A') {
                    return;
                }

                this.context?.setChatTitle(output);
            })();
        }
        return message;
    }
}