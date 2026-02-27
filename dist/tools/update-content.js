import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { KEYS, getById } from '../lib/storage.js';
export function updateContent(storage) {
    return tool(async (input) => {
        const content = await getById(storage, KEYS.content, input.contentId);
        if (!content) {
            return JSON.stringify({
                contentType: 'article',
                contentTitle: 'unknown',
                error: 'Content not found — check the content ID',
            });
        }
        content.body = input.body;
        if (input.title) {
            content.title = input.title;
        }
        content.updatedAt = new Date().toISOString();
        try {
            await storage.set(KEYS.content(content.id), content);
        }
        catch (err) {
            return JSON.stringify({
                contentType: content.type,
                contentTitle: content.title,
                error: `Failed to save content: ${err instanceof Error ? err.message : 'unknown error'}`,
            });
        }
        return JSON.stringify({
            contentType: content.type,
            contentTitle: content.title,
            contentId: content.id,
            status: content.status,
            bodyLength: content.body.length,
        });
    }, {
        name: 'updateContent',
        description: "Save or update a content draft's body text and timestamp. Call this after generating content to persist the draft.",
        schema: z.object({
            contentId: z.string().describe('ID of the content to update'),
            body: z.string().describe('New body text for the content'),
            title: z.string().optional().describe('Updated title'),
        }),
    });
}
