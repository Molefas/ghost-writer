import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';
import { getAuthUrl, exchangeCode, getAuthenticatedClient } from '../lib/gmail.js';

export function gmailAuth(storage: TrikStorageContext, config: TrikConfigContext) {
  return tool(
    async (input) => {
      const clientId = config.get('GOOGLE_CLIENT_ID');
      const clientSecret = config.get('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        return JSON.stringify({
          authStatus: 'failed',
          error:
            'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. ' +
            'Please configure these values in the trik config before authenticating.',
        });
      }

      // --- Completion flow: exchange the authorization code for tokens ---
      if (input.authCode) {
        try {
          await exchangeCode(clientId, clientSecret, input.authCode, storage);
          return JSON.stringify({ authStatus: 'completed' });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return JSON.stringify({
            authStatus: 'failed',
            error:
              `Failed to exchange authorization code: ${message}. ` +
              'The code may be invalid or expired — please try initiating the auth flow again.',
          });
        }
      }

      // --- Initiation flow: check existing tokens or generate auth URL ---
      try {
        await getAuthenticatedClient(storage, config);
        return JSON.stringify({ authStatus: 'already_authenticated' });
      } catch {
        // No valid tokens — generate a new auth URL
      }

      const authUrl = getAuthUrl(clientId, clientSecret);
      return JSON.stringify({ authStatus: 'initiated', authUrl });
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
