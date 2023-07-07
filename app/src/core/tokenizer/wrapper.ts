import { OpenAIMessage } from "../chat/types";
import type { ChatHistoryTrimmerOptions } from "./chat-history-trimmer";
// @ts-ignore
import tokenizer from "./worker?worker&url";

const worker = new ComlinkWorker<typeof import("./worker")>(
  new URL(tokenizer, import.meta.url)
);

export async function runChatTrimmer(
  messages: OpenAIMessage[],
  options: ChatHistoryTrimmerOptions
): Promise<OpenAIMessage[]> {
  return worker.runChatTrimmer(messages, options);
}

export async function countTokens(messages: OpenAIMessage[]) {
  return await worker.countTokensForMessages(messages);
}
