import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function updateContent(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        contentType: 'article',
        contentTitle: 'stub',
        error: 'Not yet implemented — coming in Phase 3',
      });
    },
    {
      name: 'updateContent',
      description: "Save or update a content draft's body text and timestamp",
      schema: z.object({
        contentId: z.string().describe('ID of the content to update'),
        body: z.string().describe('New body text for the content'),
        title: z.string().optional().describe('Updated title'),
      }),
    },
  );
}
