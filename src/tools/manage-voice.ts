import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
import { KEYS } from '../lib/storage.js';

export function manageVoice(storage: TrikStorageContext) {
  return tool(
    async (input) => {
      if (input.action === 'read') {
        const content = (await storage.get(KEYS.profileVoice) as string) ?? '';
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
      await storage.set(KEYS.profileVoice, input.content);
      return JSON.stringify({
        action: 'updated',
        charCount: input.content.length,
      });
    },
    {
      name: 'manageVoice',
      description:
        "Read or update the user's writing voice profile. Use action 'read' to load the current profile, 'update' to save a new one.",
      schema: z.object({
        action: z.enum(['read', 'update']).describe("'read' to load, 'update' to save"),
        content: z
          .string()
          .optional()
          .describe('New voice profile content (required for update)'),
      }),
    },
  );
}
