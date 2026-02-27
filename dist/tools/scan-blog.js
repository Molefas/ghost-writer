import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { KEYS, getById, getAll, addToIndex } from '../lib/storage.js';
import { discoverArticles } from '../lib/scraper.js';
import { scoreInspiration } from '../lib/scorer.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
function loadInterests() {
    try {
        return readFileSync(join(__dirname, '../../src/data/interests.md'), 'utf-8');
    }
    catch {
        return '';
    }
}
export function scanBlog(storage) {
    return tool(async (input) => {
        const source = await getById(storage, KEYS.source, input.sourceId);
        if (!source || source.type !== 'blog' || !source.url) {
            return JSON.stringify({
                blogName: 'unknown',
                articleCount: 0,
                error: 'Source not found or is not a blog with a URL',
            });
        }
        try {
            const articles = await discoverArticles(source.url);
            const interestsContent = loadInterests();
            // Get existing inspirations to deduplicate
            const existing = await getAll(storage, KEYS.inspirationIndex, KEYS.inspiration);
            const existingUrls = new Set(existing.map((i) => i.url));
            let added = 0;
            let failed = 0;
            for (const article of articles) {
                if (existingUrls.has(article.url))
                    continue;
                try {
                    const id = `insp_${nanoid(10)}`;
                    const score = scoreInspiration(article.title, article.description, interestsContent);
                    const inspiration = {
                        id,
                        sourceId: source.id,
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        score,
                        addedAt: new Date().toISOString(),
                        tags: [],
                    };
                    await storage.set(KEYS.inspiration(id), inspiration);
                    await addToIndex(storage, KEYS.inspirationIndex, id);
                    added++;
                }
                catch {
                    failed++;
                }
            }
            // Update source lastScanned
            try {
                source.lastScanned = new Date().toISOString();
                await storage.set(KEYS.source(source.id), source);
            }
            catch {
                // Non-critical: scan results are still valid
            }
            const result = {
                blogName: source.name,
                articleCount: added,
                totalDiscovered: articles.length,
                duplicatesSkipped: articles.length - added - failed,
            };
            if (failed > 0) {
                result.failedToSave = failed;
            }
            return JSON.stringify(result);
        }
        catch (err) {
            return JSON.stringify({
                blogName: source.name,
                articleCount: 0,
                error: `Failed to scan blog: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
    }, {
        name: 'scanBlog',
        description: 'Scan a blog source to discover articles and create inspirations with relevance scores',
        schema: z.object({
            sourceId: z.string().describe('ID of the blog source to scan'),
        }),
    });
}
