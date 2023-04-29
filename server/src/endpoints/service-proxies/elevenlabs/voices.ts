import express from 'express';
import RequestHandler from "../../base";
import axios from 'axios';
import { endpoint, apiKey } from './text-to-speech';
import { config } from '../../../config';

export default class ElevenLabsVoicesProxyRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const response = await axios.get(endpoint + '/v1/voices',
            {
                headers: {
                    'xi-api-key': apiKey || '',
                    'content-type': 'application/json',
                }
            });
        res.json(response.data);
    }

    public isProtected() {
        return config.services?.elevenlabs?.loginRequired ?? true;
    }
}