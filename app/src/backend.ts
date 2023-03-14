import EventEmitter from 'events';
import chatManager from './chat-manager';
import { MessageTree } from './message-tree';
import { Chat, Message } from './types';
import { AsyncLoop } from './utils';

const endpoint = '/chatapi';

export let backend: {
    current?: Backend | null
} = {};

export interface User {
    email?: string;
    name?: string;
    avatar?: string;
}

export class Backend extends EventEmitter {
    public user: User | null = null;

    private sessionInterval = new AsyncLoop(() => this.getSession(), 1000 * 30);
    private syncInterval = new AsyncLoop(() => this.sync(), 1000 * 60 * 2);

    public constructor() {
        super();

        backend.current = this;

        this.sessionInterval.start();
        this.syncInterval.start();

        chatManager.on('messages', async (messages: Message[]) => {
            if (!this.isAuthenticated) {
                return;
            }
            await this.post(endpoint + '/messages', { messages });
        });
        
        chatManager.on('title', async (id: string, title: string) => {
            if (!this.isAuthenticated) {
                return;
            }
            if (!title?.trim()) {
                return;
            }
            await this.post(endpoint + '/title', { id, title });
        });
    }

    public async getSession() {
        const wasAuthenticated = this.isAuthenticated;
        const session = await this.get(endpoint + '/session');
        if (session?.authenticated) {
            this.user = {
                email: session.email,
                name: session.name,
                avatar: session.picture,
            };
        } else {
            this.user = null;
        }
        if (wasAuthenticated !== this.isAuthenticated) {
            this.emit('authenticated', this.isAuthenticated);
        }
    }

    public async sync() {
        const response = await this.post(endpoint + '/sync', {});

        for (const chatID of Object.keys(response)) {
            try {
                const chat = chatManager.chats.get(chatID) || {
                    id: chatID,
                    messages: new MessageTree(),
                } as Chat;
                chat.title = response[chatID].title || chat.title;
                chat.messages.addMessages(response[chatID].messages);
                chatManager.loadChat(chat);
            } catch (e) {
                console.error('error loading chat', e);
            }
        }

        chatManager.emit('update');
    }

    async signIn() {
        window.location.href = endpoint + '/login';
    }

    get isAuthenticated() {
        return this.user !== null;
    }

    async logout() {
        window.location.href = endpoint + '/logout';
    }

    async shareChat(chat: Chat): Promise<string | null> {
        try {
            const { id } = await this.post(endpoint + '/share', {
                ...chat,
                messages: chat.messages.serialize(),
            });
            if (typeof id === 'string') {
                return id;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async getSharedChat(id: string): Promise<Chat | null> {
        const format = process.env.REACT_APP_SHARE_URL || (endpoint + '/share/:id');
        const url = format.replace(':id', id);
        try {
            const chat = await this.get(url);
            if (chat?.messages?.length) {
                chat.messages = new MessageTree(chat.messages);
                return chat;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async get(url: string) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    }

    async post(url: string, data: any) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    }
}

if (process.env.REACT_APP_AUTH_PROVIDER) {
    new Backend();
}