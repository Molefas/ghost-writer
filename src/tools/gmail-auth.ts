import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';

export function gmailAuth(_storage: TrikStorageContext, _config: TrikConfigContext) {
  return tool(
    async () => {
      return JSON.stringify({
        authStatus: 'failed',
        error: 'Not yet implemented — coming in Phase 4',
      });
    },
    {
      name: 'gmailAuth',
      description:
        'Initiate or complete Gmail OAuth authentication for newsletter access',
      schema: z.object({
        authCode: z
          .string()
          .optional()
          .describe('OAuth authorization code from the redirect URL'),
      }),
    },
  );
}
