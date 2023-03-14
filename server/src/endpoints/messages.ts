import express from 'express';
import RequestHandler from "./base";

export default class MessagesRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        if (!req.body.messages?.length) {
            console.log("Invalid request")
            res.sendStatus(400);
            return;
        }
        await this.context.database.insertMessages(this.userID!, req.body.messages);
        res.json({ status: 'ok' });
    }

    public isProtected() {
        return true;
    }
}