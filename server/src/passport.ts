import crypto from 'crypto';
import passport from 'passport';
import session from 'express-session';
import createSQLiteSessionStore from 'connect-sqlite3';
import { Strategy as LocalStrategy } from 'passport-local';
import ChatServer from './index';

const secret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

export function configurePassport(context: ChatServer) {
    const SQLiteStore = createSQLiteSessionStore(session);
    const sessionStore = new SQLiteStore({ db: 'sessions.db' });

    passport.use(new LocalStrategy(async (email: string, password: string, cb: any) => {
        const user = await context.database.getUser(email);

        if (!user) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }

        crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', (err, hashedPassword) => {
            if (err) {
                return cb(err);
            }

            if (!crypto.timingSafeEqual(user.passwordHash, hashedPassword)) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }

            return cb(null, user);
        });
    }));

    passport.serializeUser((user: any, cb: any) => {
        process.nextTick(() => {
            cb(null, { id: user.id, username: user.username });
        });
    });

    passport.deserializeUser((user: any, cb: any) => {
        process.nextTick(() => {
            return cb(null, user);
        });
    });

    context.app.use(session({
        secret,
        resave: false,
        saveUninitialized: false,
        store: sessionStore as any,
    }));
    context.app.use(passport.authenticate('session'));

    context.app.post('/chatapi/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/?error=login'
    }));

    context.app.post('/chatapi/register', async (req, res, next) => {
        const { username, password } = req.body;
        const salt = crypto.randomBytes(32);
        crypto.pbkdf2(password, salt, 310000, 32, 'sha256', async (err, hashedPassword) => {
            if (err) {
                return next(err);
            }
            try {
                await context.database.createUser(username, hashedPassword, salt);

                passport.authenticate('local')(req, res, () => {
                    res.redirect('/');
                });
            } catch (err) {
                res.redirect('/?error=register');
            }
        });
    });

    context.app.all('/chatapi/logout', (req, res, next) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    });
}