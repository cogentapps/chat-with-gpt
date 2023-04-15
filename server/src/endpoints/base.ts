import express from 'express';
import ChatServer from '../index';
import ExpirySet from 'expiry-set';

const recentUsers = new ExpirySet<string>(1000 * 60 * 5);
export function getActiveUsersInLast5Minutes() {
    return Array.from(recentUsers.values());
}

export default abstract class RequestHandler {
    constructor(public context: ChatServer, private req: express.Request, private res: express.Response) {
        this.callback().then(() => {});
    }

    public async callback() {
        if (!this.userID && this.isProtected()) {
            this.res.sendStatus(401);
            return;
        }

        if (this.userID) {
            recentUsers.add(this.userID);
        }

        try {
            return await this.handler(this.req, this.res);
        } catch (e) {
            console.error(e);
            this.res.sendStatus(500);
        }
    }

    public abstract handler(req: express.Request, res: express.Response): any;

    public isProtected() {
        return false;
    }

    public get userID(): string | null {
        const request = this.req as any;
        if (request.oidc) {
            const user = request.oidc.user;
            if (user) {
                return user.sub;
            }
        }

        const userID = request.session?.passport?.user?.id;
        if (userID) {
            return userID;
        }

        return null;
    }
}