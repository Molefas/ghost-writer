import type { TrikStorageContext } from '@trikhub/sdk';

export const KEYS = {
  source: (id: string) => `source:${id}`,
  inspiration: (id: string) => `insp:${id}`,
  content: (id: string) => `content:${id}`,
  sourceIndex: 'index:sources',
  inspirationIndex: 'index:inspirations',
  contentIndex: 'index:content',
  gmailTokens: 'gmail:tokens',
} as const;

export async function addToIndex(
  storage: TrikStorageContext,
  indexKey: string,
  id: string,
): Promise<void> {
  const ids = ((await storage.get(indexKey)) as string[] | null) ?? [];
  if (!ids.includes(id)) {
    ids.push(id);
    await storage.set(indexKey, ids);
  }
}

export async function removeFromIndex(
  storage: TrikStorageContext,
  indexKey: string,
  id: string,
): Promise<void> {
  const ids = ((await storage.get(indexKey)) as string[] | null) ?? [];
  const filtered = ids.filter((i) => i !== id);
  await storage.set(indexKey, filtered);
}

export async function getAll<T>(
  storage: TrikStorageContext,
  indexKey: string,
  keyFn: (id: string) => string,
): Promise<T[]> {
  const ids = ((await storage.get(indexKey)) as string[] | null) ?? [];
  if (ids.length === 0) return [];
  const keys = ids.map(keyFn);
  const map = await storage.getMany(keys);
  const items: T[] = [];
  for (const key of keys) {
    const val = map.get(key);
    if (val) items.push(val as T);
  }
  return items;
}

export async function getById<T>(
  storage: TrikStorageContext,
  keyFn: (id: string) => string,
  id: string,
): Promise<T | null> {
  const val = await storage.get(keyFn(id));
  return (val as T) ?? null;
}
