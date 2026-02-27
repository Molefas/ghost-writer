import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getAuthenticatedClient, searchEmails } from '../lib/gmail.js';
export function gmailSearch(storage, config) {
    return tool(async (input) => {
        let gmail;
        try {
            gmail = await getAuthenticatedClient(storage, config);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return JSON.stringify({
                resultCount: 0,
                senderName: input.sender,
                error: message,
            });
        }
        try {
            const emails = await searchEmails(gmail, input.sender, input.maxResults);
            return JSON.stringify({
                resultCount: emails.length,
                senderName: input.sender,
                emails: emails.map((e) => ({
                    messageId: e.messageId,
                    subject: e.subject,
                    date: e.date,
                    snippet: e.snippet,
                })),
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return JSON.stringify({
                resultCount: 0,
                senderName: input.sender,
                error: `Gmail search failed: ${message}`,
            });
        }
    }, {
        name: 'gmailSearch',
        description: 'Search Gmail emails by sender name or address',
        schema: z.object({
            sender: z.string().describe('Sender email address or name to search for'),
            maxResults: z.number().optional().describe('Maximum number of emails to return'),
        }),
    });
}
