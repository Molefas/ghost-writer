import Database from "better-sqlite3";
import path from "node:path";
import os from "node:os";

const DB_PATH = path.join(os.homedir(), ".trikhub", "storage", "storage.db");
const TRIK_ID = "ghost-writer";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: false });
    _db.pragma("journal_mode = WAL");
  }
  return _db;
}

export function getValue<T>(key: string): T | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM storage WHERE trik_id = ? AND key = ?")
    .get(TRIK_ID, key) as { value: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.value) as T;
}

export function setValue(key: string, value: unknown): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    `INSERT INTO storage (trik_id, key, value, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(trik_id, key)
     DO UPDATE SET value = excluded.value`
  ).run(TRIK_ID, key, JSON.stringify(value), now);
}

export function deleteValue(key: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM storage WHERE trik_id = ? AND key = ?")
    .run(TRIK_ID, key);
  return result.changes > 0;
}

export function getIndex(indexKey: string): string[] {
  const ids = getValue<string[]>(indexKey);
  return ids ?? [];
}

export function getAllByIndex<T>(
  indexKey: string,
  keyFn: (id: string) => string
): T[] {
  const ids = getIndex(indexKey);
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => "?").join(", ");
  const keys = ids.map(keyFn);
  const rows = db
    .prepare(
      `SELECT key, value FROM storage WHERE trik_id = ? AND key IN (${placeholders})`
    )
    .all(TRIK_ID, ...keys) as { key: string; value: string }[];

  const keyOrder = new Map(keys.map((k, i) => [k, i]));
  rows.sort((a, b) => (keyOrder.get(a.key) ?? 0) - (keyOrder.get(b.key) ?? 0));

  return rows.map((r) => JSON.parse(r.value) as T);
}

// Key pattern helpers (mirrors src/lib/storage.ts KEYS)
export const KEYS = {
  source: (id: string) => `source:${id}`,
  inspiration: (id: string) => `insp:${id}`,
  content: (id: string) => `content:${id}`,
  sourceIndex: "index:sources",
  inspirationIndex: "index:inspirations",
  contentIndex: "index:content",
  gmailTokens: "gmail:tokens",
} as const;

export function addToIndex(indexKey: string, id: string): void {
  const ids = getIndex(indexKey);
  if (!ids.includes(id)) {
    ids.push(id);
    setValue(indexKey, ids);
  }
}

export function removeFromIndex(indexKey: string, id: string): void {
  const ids = getIndex(indexKey);
  const filtered = ids.filter((i) => i !== id);
  setValue(indexKey, filtered);
}
