import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { KEYS, getAll } from '../lib/storage.js';
import { getAuthenticatedClient, searchEmails, getEmailContent, extractLinksFromEmail } from '../lib/gmail.js';
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
export function scanNewsletters(storage, config) {
    return tool(async (input) => {
        try {
            // Get all sources and filter for newsletter type
            const allSources = await getAll(storage, KEYS.sourceIndex, KEYS.source);
            let newsletterSources = allSources.filter((s) => s.type === 'newsletter' && s.email);
            // If sourceIds provided, further filter
            if (input.sourceIds && input.sourceIds.length > 0) {
                const sourceIdSet = new Set(input.sourceIds);
                newsletterSources = newsletterSources.filter((s) => sourceIdSet.has(s.id));
            }
            if (newsletterSources.length === 0) {
                return JSON.stringify({
                    emailCount: 0,
                    senderCount: 0,
                    newInspirations: 0,
                    duplicatesSkipped: 0,
                    error: 'No newsletter sources found. Add newsletter sources first with manageSources.',
                });
            }
            // Get authenticated Gmail client
            const gmail = await getAuthenticatedClient(storage, config);
            // Load interests for scoring
            const interestsContent = loadInterests();
            // Get existing inspirations for deduplication
            const existing = await getAll(storage, KEYS.inspirationIndex, KEYS.inspiration);
            const existingUrls = new Set(existing.map((i) => i.url));
            let totalEmailCount = 0;
            let totalNewInspirations = 0;
            let totalDuplicatesSkipped = 0;
            const maxEmails = input.maxEmails ?? 5;
            const CONTENT_CONCURRENCY = 3;
            // Collect all new inspirations for batched storage write
            const newInspirations = {};
            const newIds = [];
            const failedSources = [];
            for (const source of newsletterSources) {
                try {
                    // Search emails by sender address
                    const emails = await searchEmails(gmail, source.email, maxEmails);
                    totalEmailCount += emails.length;
                    // Fetch email content with bounded concurrency
                    for (let i = 0; i < emails.length; i += CONTENT_CONCURRENCY) {
                        const batch = emails.slice(i, i + CONTENT_CONCURRENCY);
                        const contents = await Promise.all(batch.map(async (email) => {
                            try {
                                const content = await getEmailContent(gmail, email.messageId);
                                return { email, content };
                            }
                            catch {
                                return null;
                            }
                        }));
                        for (const result of contents) {
                            if (!result)
                                continue;
                            const { email, content } = result;
                            const links = extractLinksFromEmail(content.html);
                            for (const link of links) {
                                if (existingUrls.has(link.url)) {
                                    totalDuplicatesSkipped++;
                                    continue;
                                }
                                const id = `insp_${nanoid(10)}`;
                                const score = scoreInspiration(link.text, email.snippet, interestsContent);
                                const inspiration = {
                                    id,
                                    sourceId: source.id,
                                    title: link.text,
                                    description: email.snippet,
                                    url: link.url,
                                    score,
                                    addedAt: new Date().toISOString(),
                                    tags: [],
                                };
                                newInspirations[KEYS.inspiration(id)] = inspiration;
                                newIds.push(id);
                                existingUrls.add(link.url);
                                totalNewInspirations++;
                            }
                        }
                    }
                    // Update source lastScanned timestamp
                    source.lastScanned = new Date().toISOString();
                    await storage.set(KEYS.source(source.id), source).catch(() => { });
                }
                catch (err) {
                    failedSources.push(source.name);
                }
            }
            // Batch write all new inspirations and update index once
            if (newIds.length > 0) {
                try {
                    await storage.setMany(newInspirations);
                    const currentIndex = (await storage.get(KEYS.inspirationIndex)) ?? [];
                    await storage.set(KEYS.inspirationIndex, [...currentIndex, ...newIds]);
                }
                catch (err) {
                    return JSON.stringify({
                        emailCount: totalEmailCount,
                        senderCount: newsletterSources.length,
                        newInspirations: 0,
                        duplicatesSkipped: totalDuplicatesSkipped,
                        error: `Found ${totalNewInspirations} new articles but failed to save them: ${err instanceof Error ? err.message : 'unknown error'}`,
                    });
                }
            }
            const result = {
                emailCount: totalEmailCount,
                senderCount: newsletterSources.length,
                newInspirations: totalNewInspirations,
                duplicatesSkipped: totalDuplicatesSkipped,
            };
            if (failedSources.length > 0) {
                result.failedSources = failedSources;
            }
            return JSON.stringify(result);
        }
        catch (err) {
            return JSON.stringify({
                emailCount: 0,
                senderCount: 0,
                newInspirations: 0,
                duplicatesSkipped: 0,
                error: `Failed to scan newsletters: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
    }, {
        name: 'scanNewsletters',
        description: 'Scan Gmail for newsletter emails and extract article links as inspirations',
        schema: z.object({
            sourceIds: z
                .array(z.string())
                .optional()
                .describe('Newsletter source IDs to scan (all if omitted)'),
            maxEmails: z
                .number()
                .optional()
                .describe('Max emails to process per source'),
        }),
    });
}
