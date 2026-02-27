import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function searchInspirations(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        resultCount: 0,
        searchCriteria: 'stub',
        error: 'Not yet implemented — coming in Phase 2',
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
        since: z.string().optional().describe('ISO date — only inspirations after this date'),
        limit: z.number().optional().describe('Max results to return'),
      }),
    },
  );
}
