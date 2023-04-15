import { Chat, OpenAIMessage, Parameters } from "../chat/types";
import { OptionsManager } from "../options";

export interface PluginContext {
    getOptions(): any;
    getCurrentChat(): Chat;
    createChatCompletion(messages: OpenAIMessage[], parameters: Parameters): Promise<string>;
    setChatTitle(title: string): Promise<void>;
}

export function createBasicPluginContext(pluginID: string, pluginOptions: OptionsManager, chatID?: string | null, chat?: Chat | null) {
    return {
        getOptions: (_pluginID = pluginID) => pluginOptions.getAllOptions(_pluginID, chatID),
        getCurrentChat: () => chat,
        createChatCompletion: async () => '',
        setChatTitle: async (title: string) => { },
    } as PluginContext;
}
