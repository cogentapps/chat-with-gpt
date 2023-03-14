import express from 'express';
import RequestHandler from "./base";

export default class GetShareRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const id = req.params.id;
        const data = await this.context.objectStore.get('chats/' + id + '.json');
        if (data) {
            res.json(JSON.parse(data));
        } else {
            res.sendStatus(404);
        }
    }
}