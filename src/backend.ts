import EventEmitter from 'events';
import { Chat } from './types';

export let backend: Backend | null = null;

export class Backend extends EventEmitter {
    constructor() {
        super();
    }

    register() {
        backend = this;
    }

    get isAuthenticated() {
        return false;
    }

    async signIn(options?: any) {
    }

    async shareChat(chat: Chat): Promise<string|null> {
        return null;
    }
    
    async getSharedChat(id: string): Promise<Chat|null> {
        return null;
    }
}

export function getBackend() {
    return backend;
}