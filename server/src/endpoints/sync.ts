import express from 'express';
import { encode } from '@msgpack/msgpack';
import ExpirySet from 'expiry-set';

import RequestHandler from "./base";

let totalUpdatesProcessed = 0;
const recentUpdates = new ExpirySet<number>(1000 * 60 * 5);

export function getNumUpdatesProcessedIn5Minutes() {
    return recentUpdates.size;
}

export default class SyncRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const encoding = await import('lib0/encoding');
        const decoding = await import('lib0/decoding');
        const syncProtocol = await import('y-protocols/sync');

        const doc = await this.context.database.getYDoc(this.userID!);
        
        const Y = await import('yjs');

        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(req.body);

        const messageType = decoding.readVarUint(decoder);

        if (messageType === syncProtocol.messageYjsSyncStep2 || messageType === syncProtocol.messageYjsUpdate) {
            await this.context.database.saveYUpdate(this.userID!, 
                decoding.readVarUint8Array(decoder));
        }   

        decoder.pos = 0;

        syncProtocol.readSyncMessage(decoder, encoder, doc, 'server');

        const responseBuffers = [
            encoding.toUint8Array(encoder),
        ];

        if (messageType === syncProtocol.messageYjsSyncStep1) {
            const encoder = encoding.createEncoder();
            syncProtocol.writeSyncStep1(encoder, doc);
            responseBuffers.push(encoding.toUint8Array(encoder));
        } else if (messageType === syncProtocol.messageYjsUpdate) {
            totalUpdatesProcessed += 1;
            recentUpdates.add(totalUpdatesProcessed);
        }

        const buffer = Buffer.from(encode(responseBuffers));

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', buffer.length);

        res.send(buffer);
    }

    public isProtected() {
        return true;
    }
}