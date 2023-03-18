import express from 'express';
import RequestHandler from "./base";

export default class SyncRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const [chats, messages, deletedChatIDs] = await Promise.all([
            this.context.database.getChats(this.userID!),
            this.context.database.getMessages(this.userID!),
            this.context.database.getDeletedChatIDs(this.userID!),
        ]);

        const output: Record<string, any> = {};

        for (const m of messages) {
            const chat = output[m.chat_id] || {
                messages: [],
            };
            chat.messages.push(m.data);
            output[m.chat_id] = chat;
        }

        for (const c of chats) {
            const chat = output[c.id] || {
                messages: [],
            };
            chat.title = c.title;
            output[c.id] = chat;
        }

        for (const chatID of deletedChatIDs) {
            output[chatID] = {
                deleted: true
            };
        }

        res.json(output);
    }

    public isProtected() {
        return true;
    }
}