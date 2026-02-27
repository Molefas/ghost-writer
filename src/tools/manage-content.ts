import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function manageContent(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        action: 'listed',
        resultCount: 0,
        error: 'Not yet implemented — coming in Phase 3',
      });
    },
    {
      name: 'manageContent',
      description: 'List, filter, change status, or delete content pieces',
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
    },
  );
}
