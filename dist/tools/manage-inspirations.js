import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { KEYS, getById, removeFromIndex } from '../lib/storage.js';
export function manageInspirations(storage) {
    return tool(async (input) => {
        switch (input.action) {
            case 'delete': {
                if (!input.inspirationId) {
                    return JSON.stringify({
                        action: 'deleted',
                        resultCount: 0,
                        error: 'inspirationId is required for delete',
                    });
                }
                const insp = await getById(storage, KEYS.inspiration, input.inspirationId);
                if (!insp) {
                    return JSON.stringify({
                        action: 'deleted',
                        resultCount: 0,
                        error: 'Inspiration not found',
                    });
                }
                try {
                    await storage.delete(KEYS.inspiration(insp.id));
                    await removeFromIndex(storage, KEYS.inspirationIndex, insp.id);
                }
                catch (err) {
                    return JSON.stringify({
                        action: 'deleted',
                        resultCount: 0,
                        error: `Failed to delete inspiration: ${err instanceof Error ? err.message : 'unknown error'}`,
                    });
                }
                return JSON.stringify({
                    action: 'deleted',
                    resultCount: 1,
                    deleted: [{ id: insp.id, title: insp.title }],
                });
            }
            case 'deleteMany': {
                if (!input.inspirationIds || input.inspirationIds.length === 0) {
                    return JSON.stringify({
                        action: 'deleted',
                        resultCount: 0,
                        error: 'inspirationIds is required for deleteMany',
                    });
                }
                const deleted = [];
                const failed = [];
                for (const id of input.inspirationIds) {
                    const insp = await getById(storage, KEYS.inspiration, id);
                    if (!insp) {
                        failed.push({ id, error: 'not found' });
                        continue;
                    }
                    try {
                        await storage.delete(KEYS.inspiration(insp.id));
                        await removeFromIndex(storage, KEYS.inspirationIndex, insp.id);
                        deleted.push({ id: insp.id, title: insp.title });
                    }
                    catch (err) {
                        failed.push({
                            id,
                            error: err instanceof Error ? err.message : 'unknown error',
                        });
                    }
                }
                return JSON.stringify({
                    action: 'deleted',
                    resultCount: deleted.length,
                    deleted,
                    ...(failed.length > 0 ? { failed } : {}),
                });
            }
            default:
                return JSON.stringify({ error: 'Unknown action' });
        }
    }, {
        name: 'manageInspirations',
        description: 'Delete one or more inspirations. Use delete for a single inspiration, ' +
            'deleteMany for batch removal (e.g., cleaning up low-relevance items).',
        schema: z.object({
            action: z
                .enum(['delete', 'deleteMany'])
                .describe('The action to perform'),
            inspirationId: z
                .string()
                .optional()
                .describe('Inspiration ID (required for delete)'),
            inspirationIds: z
                .array(z.string())
                .optional()
                .describe('Inspiration IDs (required for deleteMany)'),
        }),
    });
}
