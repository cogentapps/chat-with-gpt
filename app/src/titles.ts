import { createChatCompletion } from "./openai";
import { OpenAIMessage, Chat } from "./types";

const systemPrompt = `
Please read the following exchange and write a short, concise title describing the topic.
`.trim();

const userPrompt = (user: string, assistant: string) => `
Message: ${user}

Response: ${assistant}

Title:
`.trim();

export async function createTitle(chat: Chat, apiKey: string | undefined | null, attempt = 0): Promise<string|null> {
    if (!apiKey) {
        return null;
    }

    const nodes = Array.from(chat.messages.nodes.values());

    const firstUserMessage = nodes.find(m => m.role === 'user');
    const firstAssistantMessage = nodes.find(m => m.role === 'assistant');

    if (!firstUserMessage || !firstAssistantMessage) {
        return null;
    }

    const messages: OpenAIMessage[] = [
        {
            role: 'system',
            content: systemPrompt,
        },
        {
            role: 'user',
            content: userPrompt(firstUserMessage!.content, firstAssistantMessage!.content),
        },
    ];

    let title = await createChatCompletion(messages as any, { temperature: 0.5, apiKey });

    if (!title?.length) {
        if (firstUserMessage.content.trim().length > 2 && firstUserMessage.content.trim().length < 250) {
            return firstUserMessage.content.trim();
        }

        if (attempt === 0) {
            return createTitle(chat, apiKey, 1);
        }
    }

    // remove periods at the end of the title
    title = title.replace(/(\w)\.$/g, '$1');

    if (title.length > 250) {
        title = title.substring(0, 250) + '...';
    }

    return title;
}