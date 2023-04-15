import { OpenAIMessage } from "../chat/types";
import type { ChatHistoryTrimmerOptions } from "./chat-history-trimmer";
// @ts-ignore
import tokenizer from 'workerize-loader!./worker';

let worker: any;

async function getWorker() {
    if (!worker) {
        worker = await tokenizer();
    }
    return worker;
}

export async function runChatTrimmer(messages: OpenAIMessage[], options: ChatHistoryTrimmerOptions): Promise<OpenAIMessage[]> {
    const worker = await getWorker();
    return worker.runChatTrimmer(messages, options);
}

export async function countTokens(messages: OpenAIMessage[]) {
    const worker = await getWorker();
    return await worker.countTokensForMessages(messages);
}

// preload the worker
getWorker().then(w => {
    (window as any).worker = w;
})