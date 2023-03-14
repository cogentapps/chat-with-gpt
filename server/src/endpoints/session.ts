import express from 'express';
import RequestHandler from "./base";

export default class SessionRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const request = req as any;

        if (request.oidc) {
            const user = request.oidc.user;
            console.log(user);
            if (user) {
                res.json({
                    authenticated: true,
                    userID: user.sub,
                    name: user.name,
                    email: user.email,
                    picture: user.picture,
                });
                return;
            }
        }

        const userID = request.session?.passport?.user?.id;
        if (userID) {
            res.json({
                authenticated: true,
                userID,
                email: userID,
            });
            return;
        }
        
        res.json({
            authenticated: false,
        });
    }
}