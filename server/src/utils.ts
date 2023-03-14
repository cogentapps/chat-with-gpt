import crypto from 'crypto';

export function randomID() {
    return crypto.randomBytes(16).toString('hex');
}