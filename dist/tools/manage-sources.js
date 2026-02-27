import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { KEYS, addToIndex, removeFromIndex, getAll, getById } from '../lib/storage.js';
export function manageSources(storage) {
    return tool(async (input) => {
        switch (input.action) {
            case 'add': {
                if (!input.sourceType || !input.name) {
                    return JSON.stringify({ error: 'sourceType and name are required for add' });
                }
                const id = `src_${nanoid(10)}`;
                const source = {
                    id,
                    type: input.sourceType,
                    url: input.url,
                    email: input.email,
                    name: input.name,
                    addedAt: new Date().toISOString(),
                    lastScanned: null,
                };
                try {
                    await storage.set(KEYS.source(id), source);
                    await addToIndex(storage, KEYS.sourceIndex, id);
                }
                catch (err) {
                    return JSON.stringify({
                        action: 'added',
                        sourceType: input.sourceType,
                        sourceName: input.name,
                        error: `Failed to save source: ${err instanceof Error ? err.message : 'unknown error'}`,
                    });
                }
                return JSON.stringify({
                    action: 'added',
                    sourceType: input.sourceType,
                    sourceName: input.name,
                    id,
                });
            }
            case 'remove': {
                const source = await getById(storage, KEYS.source, input.sourceId);
                if (!source) {
                    return JSON.stringify({
                        action: 'removed',
                        sourceType: 'blog',
                        sourceName: 'unknown',
                        error: 'Source not found',
                    });
                }
                try {
                    await storage.delete(KEYS.source(source.id));
                    await removeFromIndex(storage, KEYS.sourceIndex, source.id);
                }
                catch (err) {
                    return JSON.stringify({
                        action: 'removed',
                        sourceType: source.type,
                        sourceName: source.name,
                        error: `Failed to remove source: ${err instanceof Error ? err.message : 'unknown error'}`,
                    });
                }
                return JSON.stringify({
                    action: 'removed',
                    sourceType: source.type,
                    sourceName: source.name,
                });
            }
            case 'list': {
                const sources = await getAll(storage, KEYS.sourceIndex, KEYS.source);
                const summary = sources.map((s) => ({
                    id: s.id,
                    type: s.type,
                    name: s.name,
                    url: s.url,
                    email: s.email,
                    lastScanned: s.lastScanned,
                }));
                return JSON.stringify({
                    action: 'listed',
                    sourceType: 'blog',
                    sourceName: `${sources.length} sources`,
                    sources: summary,
                });
            }
            case 'update': {
                const source = await getById(storage, KEYS.source, input.sourceId);
                if (!source) {
                    return JSON.stringify({
                        action: 'updated',
                        sourceType: 'blog',
                        sourceName: 'unknown',
                        error: 'Source not found',
                    });
                }
                if (input.name)
                    source.name = input.name;
                if (input.url)
                    source.url = input.url;
                if (input.email)
                    source.email = input.email;
                try {
                    await storage.set(KEYS.source(source.id), source);
                }
                catch (err) {
                    return JSON.stringify({
                        action: 'updated',
                        sourceType: source.type,
                        sourceName: source.name,
                        error: `Failed to update source: ${err instanceof Error ? err.message : 'unknown error'}`,
                    });
                }
                return JSON.stringify({
                    action: 'updated',
                    sourceType: source.type,
                    sourceName: source.name,
                });
            }
            default:
                return JSON.stringify({ error: 'Unknown action' });
        }
    }, {
        name: 'manageSources',
        description: 'Add, list, remove, or update content sources (blogs, articles, newsletters)',
        schema: z.object({
            action: z
                .enum(['add', 'remove', 'list', 'update'])
                .describe('The action to perform'),
            sourceType: z
                .enum(['blog', 'article', 'newsletter'])
                .optional()
                .describe('Type of source (required for add)'),
            name: z.string().optional().describe('Human-readable name (required for add)'),
            url: z.string().optional().describe('URL for blog or article sources'),
            email: z
                .string()
                .optional()
                .describe('Email address for newsletter sources'),
            sourceId: z
                .string()
                .optional()
                .describe('Source ID (required for remove/update)'),
        }),
    });
}
