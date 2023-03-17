import crypto from 'crypto';
import { auth, ConfigParams } from 'express-openid-connect';
import ChatServer from './index';

const secret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

const config: ConfigParams = {
    authRequired: false,
    auth0Logout: false,
    secret,
    baseURL: process.env.PUBLIC_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER,
    routes: {
        login: false,
        logout: false,
    },
};

export function configureAuth0(context: ChatServer) {
    context.app.use(auth(config));

    context.app.get('/chatapi/login', (req, res) => {
        res.oidc.login({
            returnTo: process.env.PUBLIC_URL,
            authorizationParams: {
                redirect_uri: process.env.PUBLIC_URL + '/chatapi/login-callback',
            },
        });
    });

    context.app.get('/chatapi/logout', (req, res) => {
        res.oidc.logout({
            returnTo: process.env.PUBLIC_URL,
        });
    });

    context.app.all('/chatapi/login-callback', (req, res) => {
        res.oidc.callback({
            redirectUri: process.env.PUBLIC_URL!,
        })
    });
}