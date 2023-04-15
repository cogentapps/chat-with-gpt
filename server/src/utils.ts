import crypto from 'crypto';

export function randomID(bytes = 16) {
    return crypto.randomBytes(bytes).toString('hex');
}