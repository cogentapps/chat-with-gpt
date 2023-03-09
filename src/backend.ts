import EventEmitter from 'events';
import { Chat } from './types';

/*

Sync and login requires a backend implementation.

Example syncing:

const customBackend = new MyCustomBackend();
customBackend.register();

In your custom backend, load saved chats from the server and call chatManager.loadChat(chat);

chatManager.on('messages', async (messages: Message[]) => {
    // send messages to server
});

chatManager.on('title', async (id: string, title: string) => {
    // send updated chat title to server
});

*/

export let backend: {
    current?: Backend | null
} = {};

export class Backend extends EventEmitter {
    register() {
        backend.current = this;
    }

    get isAuthenticated() {
        // return whether the user is currently signed in
        return false;
    }

    async signIn(options?: any) {
        // sign in the user
    }

    async shareChat(chat: Chat): Promise<string|null> {
        // create a public share from the chat, and return the share's ID
        return null;
    }
    
    async getSharedChat(id: string): Promise<Chat|null> {
        // load a publicly shared chat from its ID
        return null;
    }
}