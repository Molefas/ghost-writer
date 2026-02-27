import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';

export function getInspirationContent(_storage: TrikStorageContext) {
  return tool(
    async () => {
      return JSON.stringify({
        inspirationTitle: 'stub',
        contentLength: 0,
        error: 'Not yet implemented — coming in Phase 2',
      });
    },
    {
      name: 'getInspirationContent',
      description:
        'Fetch the full article text for an inspiration by lazy-loading from its URL',
      schema: z.object({
        inspirationId: z.string().describe('ID of the inspiration to fetch content for'),
      }),
    },
  );
}
