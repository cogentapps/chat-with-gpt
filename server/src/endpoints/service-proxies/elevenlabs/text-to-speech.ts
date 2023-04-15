import express from 'express';
import RequestHandler from "../../base";
import axios from 'axios';
import { config } from '../../../config';

export const endpoint = 'https://api.elevenlabs.io';
export const apiKey = config.services?.elevenlabs?.apiKey || process.env.ELEVENLABS_API_KEY;

export default class ElevenLabsTTSProxyRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const voiceID = req.params.voiceID;
        const response = await axios.post(endpoint + '/v1/text-to-speech/' + voiceID,
            JSON.stringify(req.body),
            {
                headers: {
                    'xi-api-key': apiKey || '',
                    'content-type': 'application/json',
                },
                responseType: 'arraybuffer',
            });
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
        res.send(response.data);
    }

    public isProtected() {
        return true;
    }
}