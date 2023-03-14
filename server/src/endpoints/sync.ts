import express from 'express';
import RequestHandler from "./base";

export default class SyncRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const [chats, messages] = await Promise.all([
            this.context.database.getChats(this.userID!),
            this.context.database.getMessages(this.userID!),
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

        res.json(output);
    }

    public isProtected() {
        return true;
    }
}