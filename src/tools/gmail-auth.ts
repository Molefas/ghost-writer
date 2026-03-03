import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';
import {
  autoAuth,
  exchangeCode,
  getAuthenticatedClient,
} from '../lib/gmail.js';

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

      // --- Manual fallback: exchange an authorization code directly ---
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

      // --- Check if already authenticated ---
      try {
        await getAuthenticatedClient(storage, config);
        return JSON.stringify({ authStatus: 'already_authenticated' });
      } catch {
        // No valid tokens — start auto-auth flow
      }

      // --- Auto-auth: start localhost server and return the auth URL ---
      try {
        const { authUrl } = await autoAuth(clientId, clientSecret, storage);
        return JSON.stringify({
          authStatus: 'awaiting_authorization',
          authUrl,
          instructions:
            'A local server is listening for the OAuth redirect. ' +
            'Tell the user to open the auth URL in their browser and authorize access. ' +
            'Once they authorize, their browser will redirect to the local server which ' +
            'will capture the code automatically. After authorizing, call gmailAuth again ' +
            'to confirm the connection.',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return JSON.stringify({
          authStatus: 'failed',
          error: `Failed to start auto-auth flow: ${message}`,
        });
      }
    },
    {
      name: 'gmailAuth',
      description:
        'Connect Gmail for newsletter access. Call with no arguments to start ' +
        'one-click OAuth — a local server listens for ~2 minutes to capture the ' +
        'authorization automatically. The user just needs to open the returned URL ' +
        'and authorize in the browser. If the redirect page fails to load (server ' +
        'timed out), ask the user to copy the "code" parameter from their browser ' +
        'URL bar and pass it as authCode to complete manually.',
      schema: z.object({
        authCode: z
          .string()
          .optional()
          .describe(
            'OAuth authorization code (manual fallback only — normally not needed)',
          ),
      }),
    },
  );
}
