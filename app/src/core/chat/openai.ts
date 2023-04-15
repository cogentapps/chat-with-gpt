import EventEmitter from "events";
import { Configuration, OpenAIApi } from "openai";
import SSE from "../utils/sse";
import { OpenAIMessage, Parameters } from "./types";
import { backend } from "../backend";

export const defaultModel = 'gpt-3.5-turbo';

export function isProxySupported() {
    return !!backend.current?.user?.services?.includes('openai');
}

function shouldUseProxy(apiKey: string | undefined | null) {
    return !apiKey && isProxySupported();
}

function getEndpoint(proxied = false) {
    return proxied ? '/chatapi/proxies/openai' : 'https://api.openai.com';
}

export interface OpenAIResponseChunk {
    id?: string;
    done: boolean;
    choices?: {
        delta: {
            content: string;
        };
        index: number;
        finish_reason: string | null;
    }[];
    model?: string;
}

function parseResponseChunk(buffer: any): OpenAIResponseChunk {
    const chunk = buffer.toString().replace('data: ', '').trim();

    if (chunk === '[DONE]') {
        return {
            done: true,
        };
    }

    const parsed = JSON.parse(chunk);

    return {
        id: parsed.id,
        done: false,
        choices: parsed.choices,
        model: parsed.model,
    };
}

export async function createChatCompletion(messages: OpenAIMessage[], parameters: Parameters): Promise<string> {
    const proxied = shouldUseProxy(parameters.apiKey);
    const endpoint = getEndpoint(proxied);

    if (!proxied && !parameters.apiKey) {
        throw new Error('No API key provided');
    }

    const response = await fetch(endpoint + '/v1/chat/completions', {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': !proxied ? `Bearer ${parameters.apiKey}` : '',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "model": parameters.model,
            "messages": messages,
            "temperature": parameters.temperature,
        }),
    });

    const data = await response.json();

    return data.choices[0].message?.content?.trim() || '';
}

export async function createStreamingChatCompletion(messages: OpenAIMessage[], parameters: Parameters) {
    const emitter = new EventEmitter();

    const proxied = shouldUseProxy(parameters.apiKey);
    const endpoint = getEndpoint(proxied);

    if (!proxied && !parameters.apiKey) {
        throw new Error('No API key provided');
    }

    const eventSource = new SSE(endpoint + '/v1/chat/completions', {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': !proxied ? `Bearer ${parameters.apiKey}` : '',
            'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
            "model": parameters.model,
            "messages": messages,
            "temperature": parameters.temperature,
            "stream": true,
        }),
    }) as SSE;

    let contents = '';

    eventSource.addEventListener('error', (event: any) => {
        if (!contents) {
            let error = event.data;
            try {
                error = JSON.parse(error).error.message;
            } catch (e) {}
            emitter.emit('error', error);
        }
    });

    eventSource.addEventListener('message', async (event: any) => {
        if (event.data === '[DONE]') {
            emitter.emit('done');
            return;
        }

        try {
            const chunk = parseResponseChunk(event.data);
            if (chunk.choices && chunk.choices.length > 0) {
                contents += chunk.choices[0]?.delta?.content || '';
                emitter.emit('data', contents);
            }
        } catch (e) {
            console.error(e);
        }
    });

    eventSource.stream();

    return {
        emitter,
        cancel: () => eventSource.close(),
    };
}

export const maxTokensByModel = {
    "chatgpt-3.5-turbo": 2048,
    "gpt-4": 8096,
}