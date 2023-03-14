import * as idb from 'idb-keyval';

let supported = true;
const inMemoryCache = new Map<string, any>();

const testDB = indexedDB.open('idb-test');
testDB.onerror = () => {
    supported = false;
};

export async function keys() {
    if (supported) {
        try {
            const keys = await idb.keys();
            return Array.from(keys).map(k => k.toString());
        } catch (e) {}
    }
    return Array.from(inMemoryCache.keys());
}

export async function set(key, value) {
    // all values are saved in memory in case IDB fails later, but only retrieved after IDB fails.
    inMemoryCache.set(key, value);

    if (supported) {
        try {
            await idb.set(key, value);
            return;
        } catch (e) {}
    }
}

export async function get(key) {
    if (supported) {
        try {
            return await idb.get(key);
        }
        catch (e) {}
    }
    return inMemoryCache.get(key);
}

export async function getMany(keys) {
    if (supported) {
        try {
            return await idb.getMany(keys);
        }
        catch (e) {}
    }
    const values: any[] = [];
    for (const key of keys) {
        values.push(inMemoryCache.get(key));
    }
    return values;
}

export async function setMany(items: [string, any][]) {
    // all values are saved in memory in case IDB fails later, but only retrieved after IDB fails.
    for (const [key, value] of items) {
        inMemoryCache.set(key, value);
    }
    if (supported) {
        try {
            await idb.setMany(items);
            return;
        } catch (e) {}
    }
}

export async function entries() {
    if (supported) {
        try {
            const entries = await idb.entries();
            return Array.from(entries)
                .map(([key, value]) => [key.toString(), value]);
        } catch (e) {}
    }
    return Array.from(inMemoryCache.entries());
}

export async function del(key: string) {
    // all values are saved in memory in case IDB fails later, but only retrieved after IDB fails.
    inMemoryCache.delete(key);
    if (supported) {
        try {
            await idb.del(key);
            return;
        } catch (e) {}
    }
}

export async function delMany(keys: string[]) {
    // all values are saved in memory in case IDB fails later, but only retrieved after IDB fails.
    for (const key of keys) {
        inMemoryCache.delete(key);
    }
    if (supported) {
        try {
            await idb.delMany(keys);
            return;
        } catch (e) {}
    }
}