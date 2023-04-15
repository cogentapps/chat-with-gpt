import express from 'express';

import RequestHandler from "./base";
import ExpiryMap from 'expiry-map';

const cache = new ExpiryMap<string, any>(1000 * 60 * 60);

interface Chat {
    id: string;
    messages: any[];
    title?: string | null;
}

export default class LegacySyncRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        if (cache.has(this.userID!)) {
            res.json(cache.get(this.userID!));
            return;
        }

        const [chats, messages, deletedChatIDs] = await Promise.all([
            this.context.database.getChats(this.userID!),
            this.context.database.getMessages(this.userID!),
            this.context.database.getDeletedChatIDs(this.userID!),
        ]);


        const response: Chat[] = [];

        for (const chat of chats) {
            if (!deletedChatIDs.includes(chat.id)) {
                const chatMessages = messages.filter((message) => message.chat_id === chat.id).map(m => m.data);

                response.push({
                    id: chat.id,
                    messages: chatMessages,
                    title: chat.title,
                });
            }
        }

        cache.set(this.userID!, response);
        
        res.json(response);
    }
}