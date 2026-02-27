import type { gmail_v1 } from 'googleapis';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';
/** Stored OAuth2 token set. */
export interface GmailTokens {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    token_type: string;
}
/** Minimal email metadata returned by search. */
export interface EmailResult {
    messageId: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
}
/** A link extracted from an email body. */
export interface ExtractedLink {
    url: string;
    text: string;
}
/**
 * Generate a Google OAuth2 consent URL for Gmail readonly access.
 */
export declare function getAuthUrl(clientId: string, clientSecret: string): string;
/**
 * Exchange an authorization code for OAuth2 tokens and persist them to storage.
 *
 * @returns The stored token set.
 */
export declare function exchangeCode(clientId: string, clientSecret: string, code: string, storage: TrikStorageContext): Promise<GmailTokens>;
/**
 * Build an authenticated Gmail API client from stored tokens.
 *
 * Automatically refreshes the access token if it is expired (or will expire
 * within the next 60 seconds) and persists the refreshed tokens back to
 * storage.
 */
export declare function getAuthenticatedClient(storage: TrikStorageContext, config: TrikConfigContext): Promise<gmail_v1.Gmail>;
/**
 * Search Gmail for emails matching a sender address or name.
 *
 * @param gmail  Authenticated Gmail API client.
 * @param sender Sender email address or display name to search for.
 * @param maxResults Maximum number of results (default 10).
 * @returns Array of email metadata.
 */
export declare function searchEmails(gmail: gmail_v1.Gmail, sender: string, maxResults?: number): Promise<EmailResult[]>;
/**
 * Fetch the full body of an email and extract its text content.
 *
 * Prefers HTML parts (for later link extraction) but falls back to plain text.
 *
 * @param gmail     Authenticated Gmail API client.
 * @param messageId The Gmail message ID.
 * @returns An object with `html` (raw HTML if available) and `text` (plain text).
 */
export declare function getEmailContent(gmail: gmail_v1.Gmail, messageId: string): Promise<{
    html: string;
    text: string;
}>;
/**
 * Extract article/content URLs from an email's HTML body.
 *
 * Filters out common non-article links (unsubscribe, social media profiles,
 * email client links, tracking pixels, etc.).
 *
 * @param htmlContent Raw HTML string from the email body.
 * @returns Array of extracted links with their anchor text.
 */
export declare function extractLinksFromEmail(htmlContent: string): ExtractedLink[];
