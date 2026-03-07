import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
import { KEYS } from '../lib/storage.js';

export function manageInterests(storage: TrikStorageContext) {
  return tool(
    async (input) => {
      if (input.action === 'read') {
        const content = (await storage.get(KEYS.profileInterests) as string) ?? '';
        return JSON.stringify({
          action: 'read',
          charCount: content.length,
          content,
        });
      }

      // action === 'update'
      if (!input.content) {
        return JSON.stringify({ error: 'content is required for update action' });
      }
      await storage.set(KEYS.profileInterests, input.content);
      return JSON.stringify({
        action: 'updated',
        charCount: input.content.length,
      });
    },
    {
      name: 'manageInterests',
      description:
        "Read or update the user's topic interests. Use action 'read' to load current interests, 'update' to save new ones. Interests are used to score article relevance.",
      schema: z.object({
        action: z.enum(['read', 'update']).describe("'read' to load, 'update' to save"),
        content: z
          .string()
          .optional()
          .describe('New interests content (required for update)'),
      }),
    },
  );
}
