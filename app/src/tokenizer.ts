import { OpenAIMessage } from "./types";

let enc: any;

setTimeout(async () => {
    const { encoding_for_model } = await import("./tiktoken/dist/tiktoken");
    enc = encoding_for_model("gpt-3.5-turbo");
}, 2000);

export function getTokenCount(input: string): number {
    return enc.encode(input).length;
}

export function shortenStringToTokenCount(input: string, targetTokenCount: number) {
    const tokens = enc.encode(input);
    const buffer = enc.decode(tokens.slice(0, targetTokenCount));
    return new TextDecoder().decode(buffer) + "(...)";
}

function serializeChatMLMessage(role: string, content: string) {
    const encodedContent = JSON.stringify(content)
        .replace(/^"/g, '').replace(/"$/g, '');

    let chatml = '';
    chatml += `{"token": "<|im_start|>"},\n `;
    chatml += `"${role.toLocaleLowerCase}\\n${encodedContent}",\n `;
    chatml += `{"token": "<|im_end|>"}, "\\n"`;

    return chatml;
}

export function getTokenCountForMessages(messages: OpenAIMessage[]): number {
    let chatml = '[\n';
    for (let i = 0; i < messages.length; i++) {
        const m = messages[i];
        const serializeMessage = serializeChatMLMessage(m.role, m.content);

        chatml += ' ' + serializeMessage;

        if (i < messages.length - 1) {
            chatml += ',';
        }
        chatml += '\n';
    }
    chatml += ']';
    return getTokenCount(chatml);
}

export function selectMessagesToSendSafely(messages: OpenAIMessage[]) {
    const maxTokens = 2048;

    if (getTokenCountForMessages(messages) <= maxTokens) {
        return messages;
    }

    const insertedSystemMessage = serializeChatMLMessage('system', 'Several messages not included due to space constraints');
    const insertedSystemMessageTokenCount = getTokenCount(insertedSystemMessage);
    const targetTokens = maxTokens - insertedSystemMessageTokenCount;
    const firstUserMessageIndex = messages.findIndex(m => m.role === 'user');
    let output = [...messages];

    let removed = false;

    // first, remove items in the 'middle' of the conversation until we're under the limit
    for (let i = firstUserMessageIndex + 1; i < messages.length - 1; i++) {
        if (getTokenCountForMessages(output) > targetTokens) {
            output.splice(i, 1);
            removed = true;
        }
    }

    // if we're still over the limit, trim message contents from oldest to newest (excluding the latest)
    if (getTokenCountForMessages(output) > targetTokens) {
        for (let i = 0; i < output.length - 1 && getTokenCountForMessages(output) > targetTokens; i++) {
            output[i].content = shortenStringToTokenCount(output[i].content, 20);
            removed = true;
        }
    }

    // if that still didn't work, just keep the system prompt and the latest message (truncated as needed)
    if (getTokenCountForMessages(output) > targetTokens) {
        const systemMessage = output.find(m => m.role === 'system')!;
        const latestMessage = { ...messages[messages.length - 1] };
        output = [systemMessage, latestMessage];
        removed = true;
        
        const excessTokens = Math.max(0, getTokenCountForMessages(output) - targetTokens);

        if (excessTokens) {
            const tokens = enc.encode(latestMessage.content);
            const buffer = enc.decode(tokens.slice(0, Math.max(0, tokens.length - excessTokens)));
            latestMessage.content = new TextDecoder().decode(buffer);
        }
    }

    if (removed) {
        output.splice(1, 0, {
            role: 'system',
            content: 'Several messages not included due to space constraints',
        });
    }

    return output;
}