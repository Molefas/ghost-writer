// Per-key mutex to prevent concurrent read-modify-write races on index arrays
const indexLocks = new Map();
function withIndexLock(key, fn) {
    const prev = indexLocks.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    indexLocks.set(key, next.then(() => { }, () => { }));
    return next;
}
export const KEYS = {
    source: (id) => `source:${id}`,
    inspiration: (id) => `insp:${id}`,
    content: (id) => `content:${id}`,
    sourceIndex: 'index:sources',
    inspirationIndex: 'index:inspirations',
    contentIndex: 'index:content',
    reference: (id) => `ref:${id}`,
    referenceIndex: 'index:references',
    gmailTokens: 'gmail:tokens',
    profileVoice: 'profile:voice',
    profileInterests: 'profile:interests',
    configStatus: 'config:status',
};
export function addToIndex(storage, indexKey, id) {
    return withIndexLock(indexKey, async () => {
        const ids = (await storage.get(indexKey)) ?? [];
        if (!ids.includes(id)) {
            ids.push(id);
            await storage.set(indexKey, ids);
        }
    });
}
export function removeFromIndex(storage, indexKey, id) {
    return withIndexLock(indexKey, async () => {
        const ids = (await storage.get(indexKey)) ?? [];
        const filtered = ids.filter((i) => i !== id);
        await storage.set(indexKey, filtered);
    });
}
export async function getAll(storage, indexKey, keyFn) {
    try {
        const ids = (await storage.get(indexKey)) ?? [];
        if (ids.length === 0)
            return [];
        const keys = ids.map(keyFn);
        const map = await storage.getMany(keys);
        const items = [];
        for (const key of keys) {
            const val = map.get(key);
            if (val)
                items.push(val);
        }
        return items;
    }
    catch (err) {
        console.error(`Failed to load collection from ${indexKey}:`, err);
        return [];
    }
}
export async function getById(storage, keyFn, id) {
    try {
        const val = await storage.get(keyFn(id));
        return val ?? null;
    }
    catch (err) {
        console.error(`Failed to load item ${id}:`, err);
        return null;
    }
}
