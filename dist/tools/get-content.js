import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { KEYS, getById } from '../lib/storage.js';
import { fetchArticleContent } from '../lib/scraper.js';
export function getInspirationContent(storage) {
    return tool(async (input) => {
        const inspiration = await getById(storage, KEYS.inspiration, input.inspirationId);
        if (!inspiration) {
            return JSON.stringify({
                inspirationTitle: 'unknown',
                contentLength: 0,
                error: 'Inspiration not found',
            });
        }
        try {
            const content = await fetchArticleContent(inspiration.url);
            return JSON.stringify({
                inspirationTitle: inspiration.title,
                contentLength: content.length,
                url: inspiration.url,
                content,
            });
        }
        catch (err) {
            return JSON.stringify({
                inspirationTitle: inspiration.title,
                contentLength: 0,
                error: `Failed to fetch content: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
    }, {
        name: 'getInspirationContent',
        description: 'Fetch the full article text for an inspiration by lazy-loading from its URL',
        schema: z.object({
            inspirationId: z
                .string()
                .describe('ID of the inspiration to fetch content for'),
        }),
    });
}
