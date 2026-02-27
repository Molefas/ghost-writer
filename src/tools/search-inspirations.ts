import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
import type { Inspiration } from '../lib/types.js';
import { KEYS, getAll } from '../lib/storage.js';

export function searchInspirations(storage: TrikStorageContext) {
  return tool(
    async (input) => {
      let inspirations = await getAll<Inspiration>(
        storage,
        KEYS.inspirationIndex,
        KEYS.inspiration,
      );

      const criteria: string[] = [];

      // Filter by query (title + description)
      if (input.query) {
        const q = input.query.toLowerCase();
        inspirations = inspirations.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q),
        );
        criteria.push(`query="${input.query}"`);
      }

      // Filter by tags
      if (input.tags && input.tags.length > 0) {
        const tags = new Set(input.tags.map((t) => t.toLowerCase()));
        inspirations = inspirations.filter((i) =>
          i.tags.some((t) => tags.has(t.toLowerCase())),
        );
        criteria.push(`tags=[${input.tags.join(',')}]`);
      }

      // Filter by minimum score
      if (input.minScore !== undefined) {
        inspirations = inspirations.filter((i) => i.score >= input.minScore!);
        criteria.push(`minScore=${input.minScore}`);
      }

      // Filter by source
      if (input.sourceId) {
        inspirations = inspirations.filter((i) => i.sourceId === input.sourceId);
        criteria.push(`source=${input.sourceId}`);
      }

      // Filter by date
      if (input.since) {
        const sinceDate = new Date(input.since).getTime();
        inspirations = inspirations.filter(
          (i) => new Date(i.addedAt).getTime() >= sinceDate,
        );
        criteria.push(`since=${input.since}`);
      }

      // Sort by score descending
      inspirations.sort((a, b) => b.score - a.score);

      // Apply limit
      if (input.limit && input.limit > 0) {
        inspirations = inspirations.slice(0, input.limit);
      }

      const results = inspirations.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description.slice(0, 200),
        url: i.url,
        score: i.score,
        tags: i.tags,
        addedAt: i.addedAt,
        sourceId: i.sourceId,
      }));

      return JSON.stringify({
        resultCount: results.length,
        searchCriteria: criteria.join(', ') || 'all',
        inspirations: results,
      });
    },
    {
      name: 'searchInspirations',
      description:
        'Search and filter curated inspirations by query, tags, score, source, or date',
      schema: z.object({
        query: z.string().optional().describe('Search query for title/description'),
        tags: z.array(z.string()).optional().describe('Filter by tags'),
        minScore: z.number().optional().describe('Minimum relevance score (1-10)'),
        sourceId: z.string().optional().describe('Filter by source'),
        since: z
          .string()
          .optional()
          .describe('ISO date — only inspirations after this date'),
        limit: z.number().optional().describe('Max results to return'),
      }),
    },
  );
}
