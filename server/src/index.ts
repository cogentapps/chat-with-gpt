require('dotenv').config()

import express from 'express';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import S3ObjectStore from './object-store/s3';
import { SQLiteAdapter } from './database/sqlite';
import SQLiteObjectStore from './object-store/sqlite';
import ObjectStore from './object-store/index';
import Database from './database/index';
import HealthRequestHandler from './endpoints/health';
import TitleRequestHandler from './endpoints/title';
import MessagesRequestHandler from './endpoints/messages';
import SyncRequestHandler from './endpoints/sync';
import ShareRequestHandler from './endpoints/share';
import BasicCompletionRequestHandler from './endpoints/completion/basic';
import StreamingCompletionRequestHandler from './endpoints/completion/streaming';
import SessionRequestHandler from './endpoints/session';
import GetShareRequestHandler from './endpoints/get-share';
import { configurePassport } from './passport';
import { configureAuth0 } from './auth0';

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

if (process.env.CI) {
    setTimeout(() => process.exit(), 10000);
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const webappPort = process.env.WEBAPP_PORT ? parseInt(process.env.WEBAPP_PORT, 10) : 3000;
const origins = (process.env.ALLOWED_ORIGINS || '').split(',');

if (process.env['GITPOD_WORKSPACE_URL']) {
    origins.push(
        process.env['GITPOD_WORKSPACE_URL']?.replace('https://', `https://${webappPort}-`)
    );
}

export default class ChatServer {
    app: express.Application;
    objectStore: ObjectStore = process.env.S3_BUCKET ? new S3ObjectStore() : new SQLiteObjectStore();
    database: Database = new SQLiteAdapter();

    constructor() {
        this.app = express();
        
        this.app.use(express.urlencoded({ extended: false }));

        if (process.env.AUTH0_CLIENT_ID && process.env.AUTH0_ISSUER && process.env.PUBLIC_URL) {
            console.log('Configuring Auth0.');
            configureAuth0(this);
        } else {
            console.log('Configuring Passport.');
            configurePassport(this);
        }

        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(compression());

        this.app.use((req, res, next) => {
            res.set({
                'Access-Control-Allow-Origin': origins.includes(req.headers.origin!) ? req.headers.origin : origins[0],
                'Access-Control-Allow-Credentials': true.toString(),
                'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
                'Access-Control-Max-Age': 2592000,
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            });
            next();
        });

        this.app.get('/chatapi/health', (req, res) => new HealthRequestHandler(this, req, res));
        this.app.get('/chatapi/session', (req, res) => new SessionRequestHandler(this, req, res));
        this.app.post('/chatapi/messages', (req, res) => new MessagesRequestHandler(this, req, res));
        this.app.post('/chatapi/title', (req, res) => new TitleRequestHandler(this, req, res));
        this.app.post('/chatapi/sync', (req, res) => new SyncRequestHandler(this, req, res));
        this.app.get('/chatapi/share/:id', (req, res) => new GetShareRequestHandler(this, req, res));
        this.app.post('/chatapi/share', (req, res) => new ShareRequestHandler(this, req, res));

        if (process.env.ENABLE_SERVER_COMPLETION) {
            this.app.post('/chatapi/completion', (req, res) => new BasicCompletionRequestHandler(this, req, res));
            this.app.post('/chatapi/completion/streaming', (req, res) => new StreamingCompletionRequestHandler(this, req, res));
        }

        if (fs.existsSync('public')) {
            this.app.use(express.static('public'));

            // serve index.html for all other routes
            this.app.get('*', (req, res) => {
                res.sendFile('public/index.html', { root: path.resolve(__dirname, '..') });
            });
        }
    }

    async initialize() {
        await this.objectStore.initialize();;
        await this.database.initialize();;

        try {
            this.app.listen(port, () => {
                console.log(`Listening on port ${port}.`);
            });
        } catch (e) {
            console.log(e);
        }
    }
}

new ChatServer().initialize();