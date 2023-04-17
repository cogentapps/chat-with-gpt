require('dotenv').config()

import compression from 'compression';
import express from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { configureAuth0 } from './auth0';
import { config } from './config';
import Database from './database/index';
import KnexDatabaseAdapter from './database/knex';
import GetShareRequestHandler from './endpoints/get-share';
import HealthRequestHandler from './endpoints/health';
import DeleteChatRequestHandler from './endpoints/delete-chat';
import ElevenLabsTTSProxyRequestHandler from './endpoints/service-proxies/elevenlabs/text-to-speech';
import ElevenLabsVoicesProxyRequestHandler from './endpoints/service-proxies/elevenlabs/voices';
import OpenAIProxyRequestHandler from './endpoints/service-proxies/openai';
import SessionRequestHandler from './endpoints/session';
import ShareRequestHandler from './endpoints/share';
import ObjectStore from './object-store/index';
import S3ObjectStore from './object-store/s3';
import SQLiteObjectStore from './object-store/sqlite';
import { configurePassport } from './passport';
import SyncRequestHandler, { getNumUpdatesProcessedIn5Minutes } from './endpoints/sync';
import LegacySyncRequestHandler from './endpoints/sync-legacy';
import { getActiveUsersInLast5Minutes } from './endpoints/base';

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

if (process.env.CI) {
    setTimeout(() => process.exit(), 10000);
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export default class ChatServer {
    authProvider = 'local';
    app: express.Application;
    objectStore: ObjectStore = process.env.S3_BUCKET ? new S3ObjectStore() : new SQLiteObjectStore();
    database: Database = new KnexDatabaseAdapter();

    constructor() {
        this.app = express();
    }

    async initialize() {
        //const { default: helmet } = await import('helmet');
        //this.app.use(helmet());

        this.app.use(express.urlencoded({ extended: false }));

        if (config.auth0?.clientID && config.auth0?.issuer && config.publicSiteURL) {
            console.log('Configuring Auth0.');
            this.authProvider = 'auth0';
            configureAuth0(this);
        } else {
            console.log('Configuring Passport.');
            this.authProvider = 'local';
            configurePassport(this);
        }

        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(compression({
            filter: (req, res) => !req.path.includes("proxies"),
        }));

        const { default: rateLimit } = await import('express-rate-limit'); // esm

        this.app.get('/chatapi/health', (req, res) => new HealthRequestHandler(this, req, res));

        this.app.get('/chatapi/session',
            rateLimit({ windowMs: 60 * 1000, max: 100 }),
            (req, res) => new SessionRequestHandler(this, req, res));

        this.app.post('/chatapi/y-sync',
            rateLimit({ windowMs: 60 * 1000, max: 100 }),
            express.raw({ type: 'application/octet-stream', limit: '10mb' }),
            (req, res) => new SyncRequestHandler(this, req, res));

        this.app.get('/chatapi/legacy-sync',
            rateLimit({ windowMs: 60 * 1000, max: 100 }),
            (req, res) => new LegacySyncRequestHandler(this, req, res));

        this.app.use(rateLimit({
            windowMs: config.rateLimit.windowMs,
            max: config.rateLimit.max,
        }));
        
        this.app.post('/chatapi/delete', (req, res) => new DeleteChatRequestHandler(this, req, res));
        this.app.get('/chatapi/share/:id', (req, res) => new GetShareRequestHandler(this, req, res));
        this.app.post('/chatapi/share', (req, res) => new ShareRequestHandler(this, req, res));

        if (config.services?.openai?.apiKey) {
            this.app.post('/chatapi/proxies/openai/v1/chat/completions', (req, res) => new OpenAIProxyRequestHandler(this, req, res));
        }

        if (config.services?.elevenlabs?.apiKey) {
            this.app.post('/chatapi/proxies/elevenlabs/v1/text-to-speech/:voiceID', (req, res) => new ElevenLabsTTSProxyRequestHandler(this, req, res));
            this.app.get('/chatapi/proxies/elevenlabs/v1/voices', (req, res) => new ElevenLabsVoicesProxyRequestHandler(this, req, res));
        }

        if (fs.existsSync('public')) {
            const match = /<script>\s*window.AUTH_PROVIDER\s*=\s*"[^"]+";?\s*<\/script>/g;
            const replace = `<script>window.AUTH_PROVIDER="${this.authProvider}"</script>`;

            const indexFilename = "public/index.html";
            let indexSource = fs.readFileSync(indexFilename, 'utf8');

            indexSource = indexSource.replace(match, replace);

            if (fs.existsSync('./data/head.html')) {
                const head = fs.readFileSync('./data/head.html').toString();
                indexSource = indexSource.replace('</head>', ` ${head} </head>`);
            }

            this.app.get('/', (req, res) => {
                res.send(indexSource);
            });

            this.app.use(express.static('public'));

            // serve index.html for all other routes
            this.app.get('*', (req, res) => {
                res.send(indexSource);
            });
        }

        await this.objectStore.initialize();
        await this.database.initialize();

        try {
            const callback = () => {
                console.log(`Listening on port ${port}.`);
            };

            if (config.tls?.key && config.tls?.cert) {
                console.log('Configuring TLS.');

                const server = https.createServer({
                    key: fs.readFileSync(config.tls.key),
                    cert: fs.readFileSync(config.tls.cert),
                }, this.app);
            
                server.listen(port, callback);
            } else if (config.tls?.selfSigned) {
                console.log('Configuring self-signed TLS.');

                if (!fs.existsSync('./data/key.pem') || !fs.existsSync('./data/cert.pem')) {
                    execSync('sh generate-self-signed-certificate.sh');
                }

                const server = https.createServer({
                    key: fs.readFileSync('./data/key.pem'),
                    cert: fs.readFileSync('./data/cert.pem'),
                }, this.app);
            
                server.listen(port, callback);
            } else {
                this.app.listen(port, callback);
            }
        } catch (e) {
            console.log(e);
        }

        setInterval(() => {
            const activeUsers = getActiveUsersInLast5Minutes();
            
            const activeUsersToDisplay = activeUsers.slice(0, 10);
            const extraActiveUsers = activeUsers.slice(10);

            const numRecentUpdates = getNumUpdatesProcessedIn5Minutes();

            console.log(`Statistics (last 5m):`);

            if (extraActiveUsers.length) {
                console.log(`  - ${activeUsers.length} active users: ${activeUsersToDisplay.join(', ')} and ${extraActiveUsers.length} more`);
            } else {
                console.log(`  - ${activeUsers.length} active users: ${activeUsersToDisplay.join(', ')}`);
            }

            console.log(`  - ${numRecentUpdates} updates processed`);
        }, 1000 * 60);
    }
}

new ChatServer().initialize();
