import express from 'express';
import RequestHandler from "./base";

export default class ShareRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const { nanoid } = await import('nanoid'); // esm

        if (!req.body.messages?.length) {
            res.sendStatus(400);
            return;
        }

        for (let length = 5; length < 24; length += 2) {
            const id = nanoid(length);
            if (await this.context.database.createShare(null, id)) {
                await this.context.objectStore.put(
                    'chats/' + id + '.json',
                    JSON.stringify({
                        title: req.body.title,
                        messages: req.body.messages,
                    }),
                    'application/json',
                );
                res.json({ id });
                return;
            }
        }

        res.sendStatus(500);
    }
}