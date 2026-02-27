import type { TrikStorageContext } from '@trikhub/sdk';
export declare const KEYS: {
    readonly source: (id: string) => string;
    readonly inspiration: (id: string) => string;
    readonly content: (id: string) => string;
    readonly sourceIndex: "index:sources";
    readonly inspirationIndex: "index:inspirations";
    readonly contentIndex: "index:content";
    readonly gmailTokens: "gmail:tokens";
};
export declare function addToIndex(storage: TrikStorageContext, indexKey: string, id: string): Promise<void>;
export declare function removeFromIndex(storage: TrikStorageContext, indexKey: string, id: string): Promise<void>;
export declare function getAll<T>(storage: TrikStorageContext, indexKey: string, keyFn: (id: string) => string): Promise<T[]>;
export declare function getById<T>(storage: TrikStorageContext, keyFn: (id: string) => string, id: string): Promise<T | null>;
