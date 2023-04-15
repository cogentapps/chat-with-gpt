import * as idb from '../utils/idb';
import * as Y from 'yjs';
import { MessageTree } from './message-tree';
import { Chat } from './types';
import { YChatDoc } from './y-chat';

export async function loadFromPreviousVersion(doc: YChatDoc) {
    const serialized = await idb.get('chats');
    if (serialized) {
        for (const chat of serialized) {
            try {
                if (chat.deleted) {
                    continue;
                }
                if (doc.has(chat.id)) {
                    continue;
                }
                const messages = new MessageTree();
                for (const m of chat.messages) {
                    messages.addMessage(m);
                }
                chat.messages = messages;
                importChat(doc, chat);
            } catch (e) {
                console.error(e);
            }
        }
    }
}

export function importChat(doc: YChatDoc, chat: Chat) {
    const ychat = doc.getYChat(chat.id, true);

    if (ychat.deleted) {
        return;
    }

    if (chat.metadata) {
        for (const key of Object.keys(chat.metadata)) {
            if (!ychat.importedMetadata.has(key)) {
                ychat.importedMetadata.set(key, chat.metadata[key]);
            }
        }
    } else if (chat.title) {
        if (!ychat.importedMetadata.has('title')) {
            ychat.importedMetadata.set('title', chat.title);
        }
    }

    if (chat.pluginOptions) {
        for (const key of Object.keys(chat.pluginOptions)) {
            const [pluginID, option] = key.split('.', 2);
            if (!ychat.pluginOptions.has(key)) {
                ychat.setOption(pluginID, option, chat.pluginOptions[key]);
            }
        }
    }

    const messages = chat.messages instanceof MessageTree ? chat.messages.serialize() : chat.messages;

    for (const message of messages) {
        if (ychat.messages.has(message.id)) {
            continue;
        }
        ychat.messages.set(message.id, message);
        ychat.content.set(message.id, new Y.Text(message.content || ''));
        if (message.done) {
            ychat.done.set(message.id, message.done);
        }
    }
}