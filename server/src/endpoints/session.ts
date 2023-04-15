import express from 'express';
import RequestHandler from "./base";
import { config } from '../config';

export default class SessionRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const request = req as any;

        const availableServiceNames = Object.keys(config.services || {})
            .filter(key => (config.services as any)?.[key]?.apiKey);

        if (request.oidc) {
            const user = request.oidc.user;
            if (user) {
                res.json({
                    authProvider: this.context.authProvider,
                    authenticated: true,
                    userID: user.sub,
                    name: user.name,
                    email: user.email,
                    picture: user.picture,
                    services: availableServiceNames,
                });
                return;
            }
        }

        const userID = request.session?.passport?.user?.id;
        if (userID) {
            res.json({
                authProvider: this.context.authProvider,
                authenticated: true,
                userID,
                email: userID,
                services: availableServiceNames,
            });
            return;
        }
        
        res.json({
            authProvider: this.context.authProvider,
            authenticated: false,
        });
    }
}