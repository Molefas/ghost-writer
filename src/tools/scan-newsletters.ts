import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function scanNewsletters(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        emailCount: 0,
        senderCount: 0,
        error: 'Not yet implemented — coming in Phase 4',
      });
    },
    {
      name: 'scanNewsletters',
      description:
        'Scan Gmail for newsletter emails and extract article links as inspirations',
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
    },
  );
}
