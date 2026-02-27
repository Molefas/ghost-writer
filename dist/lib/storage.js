export const KEYS = {
    source: (id) => `source:${id}`,
    inspiration: (id) => `insp:${id}`,
    content: (id) => `content:${id}`,
    sourceIndex: 'index:sources',
    inspirationIndex: 'index:inspirations',
    contentIndex: 'index:content',
    gmailTokens: 'gmail:tokens',
};
export async function addToIndex(storage, indexKey, id) {
    const ids = (await storage.get(indexKey)) ?? [];
    if (!ids.includes(id)) {
        ids.push(id);
        await storage.set(indexKey, ids);
    }
}
export async function removeFromIndex(storage, indexKey, id) {
    const ids = (await storage.get(indexKey)) ?? [];
    const filtered = ids.filter((i) => i !== id);
    await storage.set(indexKey, filtered);
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
