import { EventEmitter } from "events";
import { PluginDescription } from "../plugins/plugin-description";
import { Option } from "./option";
import { YChat, YChatDoc } from "../chat/y-chat";
import { globalOptions } from "../../global-options";
import { OptionGroup } from "./option-group";
import { BroadcastChannel } from "broadcast-channel";

export const broadcastChannel = new BroadcastChannel("options");

function cacheKey(groupID: string, optionID: string, chatID?: string | null) {
    return chatID ? `${chatID}.${groupID}.${optionID}` : `${groupID}.${optionID}`;
}

export class OptionsManager extends EventEmitter {
    private optionGroups: OptionGroup[];
    private optionsCache: Map<string, any> = new Map();

    constructor(private yDoc: YChatDoc, private pluginMetadata: PluginDescription[]) {
        super();

        this.optionGroups = [...globalOptions, ...this.pluginMetadata];

        // Load options from localStorage and YChats
        this.loadOptions();

        // Listen for update events on the broadcast channel
        broadcastChannel.onmessage = (event: MessageEvent) => {
            this.loadOptions();

            if (event.data?.groupID) {
                this.emit('update', event.data.groupID);
            }
        };
    }

    private loadOption(groupID: string, option: Option, yChat?: YChat) {
        if (option.scope === "chat") {
            const key: string = cacheKey(groupID, option.id, yChat?.id);
            let value: string | undefined | null;
            if (yChat) {
                value = yChat.getOption(groupID, option.id);
            }
    
            // Fallback to localStorage if value is not found in YChat
            if (typeof value === 'undefined' || value === null) {
                const fallbackKey = cacheKey(groupID, option.id);
                const raw = localStorage.getItem(fallbackKey);
                value = raw ? JSON.parse(raw) : option.defaultValue;
            }
    
            this.optionsCache.set(key, value);
        } else if (option.scope === "user") {
            const key = cacheKey(groupID, option.id);
            const value = this.yDoc.getOption(groupID, option.id) || option.defaultValue;
            this.optionsCache.set(key, value);
        } else {
            const key = cacheKey(groupID, option.id);
            const raw = localStorage.getItem(key);
            const value = raw ? JSON.parse(raw) : option.defaultValue;
            this.optionsCache.set(key, value);
        }
    }

    private loadOptions() {
        // Load browser and user-scoped options
        this.optionGroups.forEach(group => {
            group.options.forEach(option => {
                this.loadOption(group.id, option);
            });
        });

        // Load chat-scoped options from YChats
        this.yDoc.getChatIDs().forEach(chatID => {
            const yChat = this.yDoc.getYChat(chatID)!;
            this.optionGroups.forEach(group => {
                group.options.forEach(option => {
                    if (option.scope === "chat") {
                        this.loadOption(group.id, option, yChat);
                    }
                });
            });
        });

        (window as any).options = this;

        this.emit("update");
    }

    public resetOptions(groupID: string, chatID?: string | null) {
        console.log(`resetting ${groupID} options with chatID = ${chatID}`);

        const group = this.optionGroups.find(group => group.id === groupID);

        group?.options.forEach(option => {
            if (option.resettable) {
                this.setOption(group.id, option.id, option.defaultValue, option.scope === 'chat' ? chatID : null);
            }
        });
    }

    public getAllOptions(groupID: string, chatID?: string | null): Record<string, any> {
        const options: Record<string, any> = {};

        const group = this.optionGroups.find(group => group.id === groupID);

        group?.options.forEach(option => {
            options[option.id] = this.getOption(groupID, option.id, chatID);
        });

        return options;
    }

    public getOption<T=any>(groupID: string, optionID: string, chatID?: string | null, validate = false): T {
        const option = this.findOption(groupID, optionID);
        if (!option) {
            throw new Error(`option not found (group = ${groupID}), option = ${optionID}`);
        }

        const key = cacheKey(groupID, optionID, option.scope === 'chat' ? chatID : null);
        let value = this.optionsCache.get(key);

        if (typeof value !== 'undefined' && value !== null) {
            if (validate) {
                const valid = !option.validate || option.validate(value, this);
                if (valid) {
                    return value;
                }
            } else {
                return value;
            }
        }

        const fallbackKey = cacheKey(groupID, optionID);
        value = this.optionsCache.get(fallbackKey);

        if (typeof value !== 'undefined' && value !== null) {
            if (validate) {
                const valid = !option.validate || option.validate(value, this);
                if (valid) {
                    return value;
                }
            } else {
                return value;
            }
        }

        return option.defaultValue;
    }

    public getValidatedOption(groupID: string, optionID: string, chatID?: string | null): any {
        return this.getOption(groupID, optionID, chatID, true);
    }

    public setOption(groupID: string, optionID: string, value: any, chatID?: string | null) {
        const option = this.findOption(groupID, optionID);

        if (!option) {
            console.warn(`option not found (group = ${groupID}), option = ${optionID}`);
            return;
        }

        const key = cacheKey(groupID, optionID, option.scope === 'chat' ? chatID : null);

        value = value ?? null;

        if (option.scope === "chat") {
            if (!chatID) {
                console.warn(`cannot set option for chat without chatID (group = ${groupID}), option = ${optionID}, chatID = ${chatID}`);
                return;
            }
            const yChat = this.yDoc.getYChat(chatID);
            yChat?.setOption(groupID, optionID, value);

            const fallbackKey = cacheKey(groupID, optionID);
            localStorage.setItem(fallbackKey, JSON.stringify(value));
        } else if (option.scope === 'user') {
            this.yDoc.setOption(groupID, optionID, value);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }

        console.log(`setting ${groupID}.${optionID} = ${value} (${typeof value})`)

        // Update cache and emit update event
        this.optionsCache.set(key, value);
        this.emit("update", groupID, optionID);

        // Notify other tabs through the broadcast channel
        broadcastChannel.postMessage({ groupID, optionID });
    }

    public findOption(groupID: string, optionID: string): Option | undefined {
        const group = this.optionGroups.find(group => group.id === groupID);
        const option = group?.options.find(option => option.id === optionID);

        if (option) {
            return option;
        }

        console.warn("couldn't find option " + groupID + "." + optionID);
        return undefined;
    }

    public destroy() {
        this.removeAllListeners();
        broadcastChannel.onmessage = null;
    }
}
