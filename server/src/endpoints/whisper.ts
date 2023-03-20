import express from 'express';
import RequestHandler from "./base";

export default class WhisperRequestHandler extends RequestHandler {
    handler(req: express.Request, res: express.Response): any {
        res.json({ status: 'ok' });
    }
}