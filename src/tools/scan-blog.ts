import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function scanBlog(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        blogName: 'stub',
        articleCount: 0,
        error: 'Not yet implemented — coming in Phase 2',
      });
    },
    {
      name: 'scanBlog',
      description:
        'Scan a blog source to discover articles and create inspirations with relevance scores',
      schema: z.object({
        sourceId: z.string().describe('ID of the blog source to scan'),
      }),
    },
  );
}
