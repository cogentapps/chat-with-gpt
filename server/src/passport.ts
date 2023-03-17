import bcrypt from 'bcrypt';
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

        try {
            console.log(user.salt ? 'Using pbkdf2' : 'Using bcrypt');
            const isPasswordCorrect = user.salt
                ? crypto.timingSafeEqual(user.passwordHash, crypto.pbkdf2Sync(password, user.salt, 310000, 32, 'sha256'))
                : await bcrypt.compare(password, user.passwordHash.toString());

            if (!isPasswordCorrect) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }

            return cb(null, user);
        } catch (e) {
            cb(e);
        }
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

        const hashedPassword = await bcrypt.hash(password, 12);

        try {
            await context.database.createUser(username, Buffer.from(hashedPassword));

            passport.authenticate('local')(req, res, () => {
                res.redirect('/');
            });
        } catch (err) {
            console.error(err);
            res.redirect('/?error=register');
        }
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