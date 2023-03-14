import express from 'express';
import RequestHandler from "./base";

export default class TitleRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        await this.context.database.setTitle(this.userID!, req.body.id, req.body.title);
        res.json({ status: 'ok' });
    }

    public isProtected() {
        return true;
    }
}