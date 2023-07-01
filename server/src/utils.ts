import crypto from 'crypto';

export function randomID(bytes = 16) {
    return crypto.randomBytes(bytes).toString('hex');
}

export function formatTime() {
    // MM/DD/YYYY HH:MM:SS AM/PM
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year} ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
}