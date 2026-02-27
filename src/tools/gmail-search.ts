import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function gmailSearch(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        resultCount: 0,
        senderName: 'stub',
        error: 'Not yet implemented — coming in Phase 4',
      });
    },
    {
      name: 'gmailSearch',
      description: 'Search Gmail emails by sender name or address',
      schema: z.object({
        sender: z.string().describe('Sender email address or name to search for'),
        maxResults: z.number().optional().describe('Maximum number of emails to return'),
      }),
    },
  );
}
