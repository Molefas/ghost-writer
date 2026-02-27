import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function createContent(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        contentType: 'article',
        contentTitle: 'stub',
        error: 'Not yet implemented — coming in Phase 3',
      });
    },
    {
      name: 'createContent',
      description:
        'Gather source materials and create a new content draft (article, LinkedIn post, or X post)',
      schema: z.object({
        type: z
          .enum(['article', 'linkedin', 'x_post'])
          .describe('Type of content to create'),
        title: z.string().describe('Working title for the content'),
        inspirationIds: z
          .array(z.string())
          .describe('IDs of inspirations to base content on'),
        instructions: z
          .string()
          .optional()
          .describe('Additional instructions for content generation'),
      }),
    },
  );
}
