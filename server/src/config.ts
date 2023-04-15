import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import type { Knex } from 'knex';

/**
 * The Config interface represents the configuration settings for various components
 * of the application, such as the server, database and external services.
 * 
 * You may provide a `config.yaml` file in the `data` directory to override the default values.
 * (Or you can set the `CHATWITHGPT_CONFIG_FILENAME` environment variable to point to a different file.)
 */
export interface Config {
    services?: {
        openai?: {
            // The API key required to authenticate with the OpenAI service.
            // When provided, signed in users will be able to access OpenAI through the server
            // without needing their own API key.
            apiKey?: string;
        };

        elevenlabs?: {
            // The API key required to authenticate with the ElevenLabs service.
            // When provided, signed in users will be able to access ElevenLabs through the server
            // without needing their own API key.
            apiKey?: string;
        };
    };
    
    /*
    Optional configuration for enabling Transport Layer Security (TLS) in the server.
    Requires specifying the file paths for the key and cert files. Includes:
    - key: The file path to the TLS private key file.
    - cert: The file path to the TLS certificate file.
    */
    tls?: {
        selfSigned?: boolean;
        key?: string;
        cert?: string;
    };

    /*
    The configuration object for the Knex.js database client.
    Detailed configuration options can be found in the Knex.js documentation:
        https://knexjs.org/guide/#configuration-options
    */
    database: Knex.Config;

    /*
    The secret session key used to encrypt the session cookie.
    If not provided, a random key will be generated.
    Changing this value will invalidate all existing sessions.
    */
    authSecret: string;

    /*
    Optional configuration object for the Auth0 authentication service.
    If provided, the server will use Auth0 for authentication.
    Otherwise, it will use a local authentication system.
    */
    auth0?: {
        clientID?: string;
        issuer?: string;
    };

    /*
    The URL of the public-facing server.
    */
    publicSiteURL?: string;

    /*
    The configuration object for the rate-limiting middleware.
    Each IP address is limited to a certain number of requests (max) per time window (windowMs).
    Detailed configuration options can be found in the Express Rate Limit documentation:
        https://www.npmjs.com/package/express-rate-limit
    */
    rateLimit: {
        windowMs?: number;
        max?: number;
    };
}

// default config:
let config: Config = {
    authSecret: crypto.randomBytes(32).toString('hex'),
    database: {
        client: 'sqlite3',
        connection: {
            filename: './data/chat.sqlite',
        },
        useNullAsDefault: true,
    },
    rateLimit: {
        // limit each IP to 100 requests per minute:
        max: 100,
        windowMs: 60 * 1000, // 1 minute
    }
};

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

const filename = process.env.CHATWITHGPT_CONFIG_FILENAME
    ? path.resolve(process.env.CHATWITHGPT_CONFIG_FILENAME) 
    : path.resolve(__dirname, '../data/config.yaml');

if (fs.existsSync(filename)) {
    config = {
        ...config,
        ...parse(fs.readFileSync(filename).toString()),
    };
    console.log("Loaded config from:", filename);
}

if (process.env.AUTH_SECRET) {
    config.authSecret = process.env.AUTH_SECRET;
}

if (process.env.RATE_LIMIT_WINDOW_MS) {
    config.rateLimit.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10);
}
if (process.env.RATE_LIMIT_MAX) {
    config.rateLimit.max = parseInt(process.env.RATE_LIMIT_MAX, 10);
}

if (process.argv.includes('--self-signed')) {
    config.tls = {
        selfSigned: true,
    };
}

if (config.publicSiteURL) {
    config.publicSiteURL = config.publicSiteURL.replace(/\/$/, '');
}

export {
    config
};