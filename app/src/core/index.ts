import { BroadcastChannel } from 'broadcast-channel';
import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message, Parameters, UserSubmittedMessage } from './chat/types';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { YChatDoc } from './chat/y-chat';
import { loadFromPreviousVersion as loadSavedChatsFromPreviousVersion } from './chat/chat-persistance';
import { Search } from './search';
import { ReplyRequest } from './chat/create-reply';
import { OptionsManager } from './options';
import { Option } from './options/option';
import { pluginMetadata } from './plugins/metadata';
import { pluginRunner } from "./plugins/plugin-runner";
import { createBasicPluginContext } from './plugins/plugin-context';

export const channel = new BroadcastChannel('chats');

export class ChatManager extends EventEmitter {
    public doc!: YChatDoc;
    private provider!: IndexeddbPersistence;
    private search!: Search;
    public options!: OptionsManager;
    private username: string | null = "anonymous";

    private activeReplies = new Map<string, ReplyRequest>();
    private changedIDs = new Set<string>();
    public lastReplyID: string | null = null;

    constructor() {
        super();

        this.setMaxListeners(1000);

        console.log('initializing chat manager');

        this.doc = this.attachYDoc('anonymous');

        loadSavedChatsFromPreviousVersion(this.doc)
            .then(() => this.emit('update'));
        
        setInterval(() => this.emitChanges());

        channel.onmessage = message => {
            if (message.type === 'y-update') {
                this.applyYUpdate(message.data);
            }
        };

        (window as any).chat = this;
    }

    public login(username: string) {
        if (username && this.username !== username) {
            this.username = username;
            this.attachYDoc(username);
        }
    }

    private attachYDoc(username: string) {
        console.log('attaching y-doc for ' + username);

        // detach current doc
        const doc = this.doc as YChatDoc | undefined;
        const provider = this.provider as IndexeddbPersistence | undefined;
        doc?.removeAllListeners();
        
        const pluginOptionsManager = this.options as OptionsManager | undefined;
        pluginOptionsManager?.destroy();

        // attach new doc
        this.doc = new YChatDoc();
        this.doc.on('update', chatID => this.changedIDs.add(chatID));
        this.doc.root.on('update', (update, origin) => {
            if (!(origin instanceof IndexeddbPersistence) && origin !== 'sync') {
                this.emit('y-update', update);
                channel.postMessage({ type: 'y-update', data: update });
            } else {
                console.log("IDB/sync update");
            }
        });
        this.search = new Search(this);

        // connect new doc to persistance, scoped to the current username
        this.provider = new IndexeddbPersistence('chats:' + username, this.doc.root);
        this.provider.whenSynced.then(() => {
            this.doc.getChatIDs().map(id => this.emit(id));
            this.emit('update');
        });

        this.options = new OptionsManager(this.doc, pluginMetadata);
        this.options.on('update', (...args) => this.emit('plugin-options-update', ...args));

        pluginRunner(
            'init',
            pluginID => createBasicPluginContext(pluginID, this.options),
            plugin => plugin.initialize(),
        );

        if (username !== 'anonymous') {
            // import chats from the anonymous doc after signing in
            provider?.whenSynced.then(() => {
                if (doc) {
                    Y.applyUpdate(this.doc.root, Y.encodeStateAsUpdate(doc.root));
                    setTimeout(() => provider.clearData(), 10 * 1000);
                }
            });
        }

        return this.doc;
    }

    public applyYUpdate(update: Uint8Array) {
        Y.applyUpdate(this.doc.root, update);
    }

    private emitChanges() {
        const ids = Array.from(this.changedIDs);
        this.changedIDs.clear();
        
        for (const id of ids) {
            this.emit(id);
            this.search.update(id);
        }

        if (ids.length) {
            this.emit('update');
        }
    }

    public async sendMessage(userSubmittedMessage: UserSubmittedMessage) {
        const chat = this.doc.getYChat(userSubmittedMessage.chatID);

        if (!chat) {
            throw new Error('Chat not found');
        }

        const message: Message = {
            id: uuidv4(),
            parentID: userSubmittedMessage.parentID,
            chatID: userSubmittedMessage.chatID,
            timestamp: Date.now(),
            role: 'user',
            content: userSubmittedMessage.content,
            done: true,
        };

        this.doc.addMessage(message);

        const messages: Message[] = this.doc.getMessagesPrecedingMessage(message.chatID, message.id);
        messages.push(message);

        await this.getReply(messages, userSubmittedMessage.requestedParameters);
    }

    public async regenerate(message: Message, requestedParameters: Parameters) {
        const messages = this.doc.getMessagesPrecedingMessage(message.chatID, message.id);
        await this.getReply(messages, requestedParameters);
    }

    private async getReply(messages: Message[], requestedParameters: Parameters) {
        const latestMessage = messages[messages.length - 1];
        const chatID = latestMessage.chatID;
        const parentID = latestMessage.id;
        const chat = this.doc.getYChat(latestMessage.chatID);

        if (!chat) {
            throw new Error('Chat not found');
        }

        const message: Message = {
            id: uuidv4(),
            parentID,
            chatID,
            timestamp: Date.now(),
            role: 'assistant',
            model: requestedParameters.model,
            content: '',
        };

        this.lastReplyID = message.id;

        this.doc.addMessage(message);

        const request = new ReplyRequest(this.get(chatID), chat, messages, message.id, requestedParameters, this.options);
        request.on('done', () => this.activeReplies.delete(message.id));
        request.execute();

        this.activeReplies.set(message.id, request);
    }

    public cancelReply(chatID: string | undefined, id: string) {
        this.activeReplies.get(id)?.onCancel();
        this.activeReplies.delete(id);
    }

    public async createChat(id?: string): Promise<string> {
        return this.doc.createYChat(id);
    }

    public get(id: string): Chat {
        return this.doc.getChat(id);
    }

    public has(id: string) {
        return this.doc.has(id);
    }

    public all(): Chat[] {
        return this.doc.getChatIDs().map(id => this.get(id));
    }

    public deleteChat(id: string, broadcast = true) {
        this.doc.delete(id);
        this.search.delete(id);
    }

    public searchChats(query: string) {
        return this.search.query(query);
    }

    public getPluginOptions(chatID?: string) {
        const pluginOptions: Record<string, Record<string, any>> = {};

        for (const description of pluginMetadata) {
            pluginOptions[description.id] = this.options.getAllOptions(description.id, chatID);
        }

        return pluginOptions;
    }

    public setPluginOption(pluginID: string, optionID: string, value: any, chatID?: string) {
        this.options.setOption(pluginID, optionID, value, chatID);
    }

    public resetPluginOptions(pluginID: string, chatID?: string | null) {
        this.options.resetOptions(pluginID, chatID);
    }

    public getQuickSettings(): Array<{ groupID: string, option: Option }> {
        const options = this.options.getAllOptions('quick-settings');
        return Object.keys(options)
            .filter(key => options[key])
            .map(key => {
                const groupID = key.split('--')[0];
                const optionID = key.split('--')[1];
                return {
                    groupID,
                    option: this.options.findOption(groupID, optionID)!,
                };
            })
            .filter(o => !!o.option);
    }
}