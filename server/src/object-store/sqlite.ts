import { verbose } from "sqlite3";
import ObjectStore from "./index";

const sqlite3 = verbose();

const db = new sqlite3.Database('./data/object-store.sqlite');

export interface StoredObject {
    key: string;
    value: string;
}

export default class SQLiteObjectStore extends ObjectStore {
    public async initialize() {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS objects (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);
        });
    }

    public async get(key: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM objects WHERE key = ?`, [key], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row?.value ?? null);
                    console.log(`[object-store:sqlite] retrieved object ${key}`)
                }
            });
        });
    }

    public async put(key: string, value: string, contentType: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run(`INSERT OR REPLACE INTO objects (key, value) VALUES (?, ?)`, [key, value], (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`[object-store:sqlite] stored object ${key}`)
                    resolve();
                }
            });
        });
    }
}