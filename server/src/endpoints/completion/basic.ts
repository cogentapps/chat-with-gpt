import express from 'express';
import { Configuration, OpenAIApi } from "openai";
import RequestHandler from "../base";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default class BasicCompletionRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const response = await openai.createChatCompletion(req.body);
        res.json(response);
    }

    public isProtected() {
        return true;
    }
}