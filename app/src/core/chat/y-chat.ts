import * as Y from 'yjs';
import { Chat, Message } from './types';
import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import { MessageTree } from './message-tree';

const METADATA_KEY = 'metadata';
const IMPORTED_METADATA_KEY = 'imported-metadata';
const PLUGIN_OPTIONS_KEY = 'plugin-options';
const MESSAGES_KEY = 'messages';
const CONTENT_KEY = 'messages:content';
const DONE_KEY = 'messages:done';

export class YChat {
    private callback: any;
    private pendingContent = new Map<string, string>();
    private prefix = 'chat.' + this.id + '.';

    public static from(root: Y.Doc, id: string) {
        // const id = data.get('metadata').get('id') as string;
        return new YChat(id, root);
    }

    constructor(public readonly id: string, public root: Y.Doc) {
        this.purgeDeletedValues();
    }

    public observeDeep(callback: any) {
        this.callback = callback;
        this.metadata?.observeDeep(callback);
        this.pluginOptions?.observeDeep(callback);
        this.messages?.observeDeep(callback);
        this.content?.observeDeep(callback);
        this.done?.observeDeep(callback);
    }

    public get deleted(): boolean {
        return this.metadata.get('deleted') || false;
    }

    public get metadata(): Y.Map<any> {
        return this.root.getMap<any>(this.prefix + METADATA_KEY);
    }

    public get importedMetadata(): Y.Map<any> {
        return this.root.getMap<any>(this.prefix + IMPORTED_METADATA_KEY);
    }

    public get pluginOptions(): Y.Map<any> {
        return this.root.getMap<any>(this.prefix + PLUGIN_OPTIONS_KEY);
    }

    public get messages(): Y.Map<Message> {
        return this.root.getMap<Message>(this.prefix + MESSAGES_KEY);
    }

    public get content(): Y.Map<Y.Text> {
        return this.root.getMap<Y.Text>(this.prefix + CONTENT_KEY);
    }

    public get done(): Y.Map<boolean> {
        return this.root.getMap<boolean>(this.prefix + DONE_KEY);
    }

    public get title() {
        return (this.metadata.get('title') as string) || (this.importedMetadata.get('title') as string) || null;
    }

    public set title(value: string | null) {
        if (value) {
            this.metadata.set('title', value);
        }
    }

    public setPendingMessageContent(messageID: string, value: string) {
        this.pendingContent.set(messageID, value);
        this.callback?.();
    }

    public setMessageContent(messageID: string, value: string) {
        this.pendingContent.delete(messageID);
        this.content.set(messageID, new Y.Text(value));
    }

    public getMessageContent(messageID: string) {
        return this.pendingContent.get(messageID) || this.content.get(messageID)?.toString() || "";
    }

    public onMessageDone(messageID: string) {
        this.done.set(messageID, true);
    }

    public getOption(pluginID: string, optionID: string): any {
        const key = pluginID + "." + optionID;
        return this.pluginOptions?.get(key) || null;
    }

    public setOption(pluginID: string, optionID: string, value: any) {
        const key = pluginID + "." + optionID;
        return this.pluginOptions.set(key, value);
    }

    public hasOption(pluginID: string, optionID: string) {
        const key = pluginID + "." + optionID;
        return this.pluginOptions.has(key);
    }

    public delete() {
        if (!this.deleted) {
            this.metadata.clear();
            this.pluginOptions.clear();
            this.messages.clear();
            this.content.clear();
            this.done.clear();
        } else {
            this.purgeDeletedValues();
        }
    }

    private purgeDeletedValues() {
        if (this.deleted) {
            if (this.metadata.size > 1) {
                for (const key of Array.from(this.metadata.keys())) {
                    if (key !== 'deleted') {
                        this.metadata.delete(key);
                    }
                }
            }
            if (this.pluginOptions.size > 0) {
                this.pluginOptions.clear();
            }
            if (this.messages.size > 0) {
                this.messages.clear();
            }
            if (this.content.size > 0) {
                this.content.clear();
            }
            if (this.done.size > 0) {
                this.done.clear();
            }
        }
    }
}

export class YChatDoc extends EventEmitter {
    public root = new Y.Doc();
    // public chats = this.root.getMap<Y.Map<any>>('chats');
    // public deletedChatIDs = this.root.getArray<string>('deletedChatIDs');
    public deletedChatIDsSet = new Set<string>();
    public options = this.root.getMap<Y.Map<any>>('options');
    private yChats = new Map<string, YChat>();

    private observed = new Set<string>();

    constructor() {
        super();

        this.root.whenLoaded.then(() => {
            const chatIDs = Array.from(this.root.getMap('chats').keys());
            for (const id of chatIDs) {
                this.observeChat(id);
            }
        });
    }

    private observeChat(id: string, yChat = this.getYChat(id)) {
        if (!this.observed.has(id)) {
            yChat?.observeDeep(() => this.emit('update', id));
            this.observed.add(id);
        }
    }

    // public set(id: string, chat: YChat) {
    //     this.chats.set(id, chat.data);

    //     if (!this.observed.has(id)) {
    //         this.getYChat(id)?.observeDeep(() => this.emit('update', id));
    //         this.observed.add(id);
    //     }
    // }

    public get chatIDMap() {
        return this.root.getMap('chatIDs');
    }

    public getYChat(id: string, expectContent = false) {
        let yChat = this.yChats.get(id);

        if (!yChat) {
            yChat = YChat.from(this.root, id);
            this.yChats.set(id, yChat);
        }

        if (expectContent && !this.chatIDMap.has(id)) {
            this.chatIDMap.set(id, true);
        }

        this.observeChat(id, yChat);

        return yChat;
    }

    public delete(id: string) {
        this.getYChat(id)?.delete();
    }

    public has(id: string) {
        return this.chatIDMap.has(id) && !YChat.from(this.root, id).deleted;
    }

    public getChatIDs() {
        return Array.from(this.chatIDMap.keys());
    }

    public getAllYChats() {
        return this.getChatIDs().map(id => this.getYChat(id)!);
    }

    public transact(cb: () => void) {
        return this.root.transact(cb);
    }

    public addMessage(message: Message) {
        const chat = this.getYChat(message.chatID, true);

        if (!chat) {
            throw new Error('Chat not found');
        }

        this.transact(() => {
            chat.messages.set(message.id, {
                ...message,
                content: '',
            });
            chat.content.set(message.id, new Y.Text(message.content || ''));
            if (message.done) {
                chat.done.set(message.id, message.done);
            }
        });
    }

    public createYChat(id = uuidv4()) {
        // return new YChat(id, this.root);
        // this.set(id, chat);
        return id;
    }

    public getMessageTree(chatID: string): MessageTree {
        const tree = new MessageTree();
        const chat = this.getYChat(chatID);

        chat?.messages?.forEach(m => {
            try {
                const content = chat.getMessageContent(m.id);
                const done = chat.done.get(m.id) || false;
                tree.addMessage(m, content, done);
            } catch (e) {
                console.warn(`failed to load message ${m.id}`, e);
            }
        });

        return tree;
    }

    public getMessagesPrecedingMessage(chatID: string, messageID: string) {
        const tree = this.getMessageTree(chatID);
        const message = tree.get(messageID);

        if (!message) {
            throw new Error("message not found: " + messageID);
        }

        const messages: Message[] = message.parentID
            ? tree.getMessageChainTo(message.parentID)
            : [];

        return messages;
    }

    public getChat(id: string): Chat {
        const chat = this.getYChat(id);
        const tree = this.getMessageTree(id);
        return {
            id,
            messages: tree,
            title: chat.title,
            metadata: {
                ...chat.importedMetadata.toJSON(),
                ...chat.metadata.toJSON(),
            },
            pluginOptions: chat?.pluginOptions?.toJSON() || {},
            deleted: !chat.deleted,
            created: tree.first?.timestamp || 0,
            updated: tree.mostRecentLeaf()?.timestamp || 0,
        }
    }

    public getOption(pluginID: string, optionID: string): any {
        const key = pluginID + "." + optionID;
        return this.options.get(key);
    }

    public setOption(pluginID: string, optionID: string, value: any) {
        const key = pluginID + "." + optionID;
        return this.options.set(key, value);
    }
}