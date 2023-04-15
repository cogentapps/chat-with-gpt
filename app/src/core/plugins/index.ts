import { OpenAIMessage, Parameters } from "../chat/types";
import { PluginContext } from "./plugin-context";
import { PluginDescription } from "./plugin-description";

export default class Plugin<T=any> {
    constructor(public context?: PluginContext) {
    }

    async initialize() {
    }

    describe(): PluginDescription {
        throw new Error('not implemented');
    }

    get options(): T | undefined {
        return this.context?.getOptions();
    }

    async preprocessModelInput(messages: OpenAIMessage[], parameters: Parameters): Promise<{
        messages: OpenAIMessage[],
        parameters: Parameters,
    }> {
        return { messages, parameters };
    }

    async postprocessModelOutput(message: OpenAIMessage, context: OpenAIMessage[], parameters: Parameters, done: boolean): Promise<OpenAIMessage> {
        return message;
    }
}