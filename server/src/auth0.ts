import { auth, ConfigParams } from 'express-openid-connect';
import ChatServer from './index';
import { config } from './config';

const auth0Config: ConfigParams = {
    authRequired: false,
    auth0Logout: false,
    secret: config.authSecret,
    baseURL: config.publicSiteURL,
    clientID: config.auth0?.clientID,
    issuerBaseURL: config.auth0?.issuer,
    routes: {
        login: false,
        logout: false,
    },
};

export function configureAuth0(context: ChatServer) {
    if (!config.publicSiteURL) {
        throw new Error('Missing public site URL in config, required for Auth0');
    }
    if (!config.auth0?.clientID) {
        throw new Error('Missing Auth0 client ID in config');
    }
    if (!config.auth0?.issuer) {
        throw new Error('Missing Auth0 issuer in config');
    }

    context.app.use(auth(auth0Config));

    context.app.get('/chatapi/login', (req, res) => {
        res.oidc.login({
            returnTo: config.publicSiteURL,
            authorizationParams: {
                redirect_uri: config.publicSiteURL + '/chatapi/login-callback',
            },
        });
    });

    context.app.get('/chatapi/logout', (req, res) => {
        res.oidc.logout({
            returnTo: config.publicSiteURL,
        });
    });

    context.app.all('/chatapi/login-callback', (req, res) => {
        res.oidc.callback({
            redirectUri: config.publicSiteURL!,
        });
    });
}