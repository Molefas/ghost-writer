import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { KEYS, getAll, getById, removeFromIndex } from '../lib/storage.js';
export function manageContent(storage) {
    return tool(async (input) => {
        switch (input.action) {
            case 'list': {
                let items = await getAll(storage, KEYS.contentIndex, KEYS.content);
                if (input.filterType) {
                    items = items.filter((c) => c.type === input.filterType);
                }
                if (input.filterStatus) {
                    items = items.filter((c) => c.status === input.filterStatus);
                }
                return JSON.stringify({
                    action: 'listed',
                    resultCount: items.length,
                    content: items.map((c) => ({
                        id: c.id,
                        type: c.type,
                        title: c.title,
                        status: c.status,
                        bodyLength: c.body.length,
                        inspirationCount: c.inspirationIds.length,
                        createdAt: c.createdAt,
                        updatedAt: c.updatedAt,
                    })),
                });
            }
            case 'setStatus': {
                if (!input.contentId || !input.status) {
                    return JSON.stringify({
                        action: 'status_changed',
                        resultCount: 0,
                        error: 'contentId and status are required for setStatus',
                    });
                }
                const content = await getById(storage, KEYS.content, input.contentId);
                if (!content) {
                    return JSON.stringify({
                        action: 'status_changed',
                        resultCount: 0,
                        error: 'Content not found',
                    });
                }
                content.status = input.status;
                content.updatedAt = new Date().toISOString();
                try {
                    await storage.set(KEYS.content(content.id), content);
                }
                catch (err) {
                    return JSON.stringify({
                        action: 'status_changed',
                        resultCount: 0,
                        error: `Failed to update status: ${err instanceof Error ? err.message : 'unknown error'}`,
                    });
                }
                return JSON.stringify({
                    action: 'status_changed',
                    resultCount: 1,
                    contentId: content.id,
                    title: content.title,
                    newStatus: content.status,
                });
            }
            case 'delete': {
                if (!input.contentId) {
                    return JSON.stringify({
                        action: 'deleted',
                        resultCount: 0,
                        error: 'contentId is required for delete',
                    });
                }
                const content = await getById(storage, KEYS.content, input.contentId);
                if (!content) {
                    return JSON.stringify({
                        action: 'deleted',
                        resultCount: 0,
                        error: 'Content not found',
                    });
                }
                try {
                    await storage.delete(KEYS.content(content.id));
                    await removeFromIndex(storage, KEYS.contentIndex, content.id);
                }
                catch (err) {
                    return JSON.stringify({
                        action: 'deleted',
                        resultCount: 0,
                        error: `Failed to delete content: ${err instanceof Error ? err.message : 'unknown error'}`,
                    });
                }
                return JSON.stringify({
                    action: 'deleted',
                    resultCount: 1,
                    contentId: content.id,
                    title: content.title,
                });
            }
        }
    }, {
        name: 'manageContent',
        description: 'List, filter, change status, or delete content pieces. Use setStatus to mark drafts as done.',
        schema: z.object({
            action: z
                .enum(['list', 'setStatus', 'delete'])
                .describe('The action to perform'),
            contentId: z
                .string()
                .optional()
                .describe('Content ID (required for setStatus/delete)'),
            status: z
                .enum(['draft', 'done'])
                .optional()
                .describe('New status (required for setStatus)'),
            filterType: z
                .enum(['article', 'linkedin', 'x_post'])
                .optional()
                .describe('Filter by content type'),
            filterStatus: z
                .enum(['draft', 'done'])
                .optional()
                .describe('Filter by status'),
        }),
    });
}
