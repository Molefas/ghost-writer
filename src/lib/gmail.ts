import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import * as cheerio from 'cheerio';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';
import { KEYS } from './storage.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REDIRECT_URI = 'http://localhost';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// ---------------------------------------------------------------------------
// OAuth2 Flow
// ---------------------------------------------------------------------------

/**
 * Generate a Google OAuth2 consent URL for Gmail readonly access.
 */
export function getAuthUrl(clientId: string, clientSecret: string): string {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * Exchange an authorization code for OAuth2 tokens and persist them to storage.
 *
 * @returns The stored token set.
 */
export async function exchangeCode(
  clientId: string,
  clientSecret: string,
  code: string,
  storage: TrikStorageContext,
): Promise<GmailTokens> {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('OAuth2 token exchange did not return an access_token');
  }
  if (!tokens.refresh_token) {
    throw new Error(
      'OAuth2 token exchange did not return a refresh_token. ' +
        'Make sure the consent prompt was shown (prompt=consent) and access_type=offline.',
    );
  }

  const stored: GmailTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    token_type: tokens.token_type ?? 'Bearer',
  };

  await storage.set(KEYS.gmailTokens, stored);
  return stored;
}

/**
 * Build an authenticated Gmail API client from stored tokens.
 *
 * Automatically refreshes the access token if it is expired (or will expire
 * within the next 60 seconds) and persists the refreshed tokens back to
 * storage.
 */
export async function getAuthenticatedClient(
  storage: TrikStorageContext,
  config: TrikConfigContext,
): Promise<gmail_v1.Gmail> {
  const tokens = (await storage.get(KEYS.gmailTokens)) as GmailTokens | null;
  if (!tokens) {
    throw new Error(
      'Gmail is not authenticated. Run the gmailAuth tool first to connect your Google account.',
    );
  }

  const clientId = config.get('GOOGLE_CLIENT_ID');
  const clientSecret = config.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in trik configuration.',
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const credentials: Credentials = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
  };
  oauth2Client.setCredentials(credentials);

  // Auto-refresh if the token is expired or about to expire (within 60s)
  const now = Date.now();
  if (tokens.expiry_date <= now + 60_000) {
    const { credentials: refreshed } = await oauth2Client.refreshAccessToken();
    const updatedTokens: GmailTokens = {
      access_token: refreshed.access_token ?? tokens.access_token,
      refresh_token: refreshed.refresh_token ?? tokens.refresh_token,
      expiry_date: refreshed.expiry_date ?? Date.now() + 3600 * 1000,
      token_type: refreshed.token_type ?? tokens.token_type,
    };
    await storage.set(KEYS.gmailTokens, updatedTokens);
    oauth2Client.setCredentials(updatedTokens);
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// ---------------------------------------------------------------------------
// Email Operations
// ---------------------------------------------------------------------------

/**
 * Search Gmail for emails matching a sender address or name.
 *
 * @param gmail  Authenticated Gmail API client.
 * @param sender Sender email address or display name to search for.
 * @param maxResults Maximum number of results (default 10).
 * @returns Array of email metadata.
 */
export async function searchEmails(
  gmail: gmail_v1.Gmail,
  sender: string,
  maxResults: number = 10,
): Promise<EmailResult[]> {
  // Sanitize sender to prevent Gmail query injection
  const safeSender = sender.replace(/"/g, '');
  const query = `from:"${safeSender}"`;
  const capped = Math.min(maxResults, 50);
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: capped,
  });

  const messageIds = listResponse.data.messages ?? [];
  if (messageIds.length === 0) return [];

  const CONCURRENCY = 5;
  const results: EmailResult[] = [];

  for (let i = 0; i < messageIds.length; i += CONCURRENCY) {
    const batch = messageIds.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      batch.map(async (msg) => {
        if (!msg.id) return null;
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        });

        const headers = detail.data.payload?.headers ?? [];
        const subject = headers.find((h) => h.name === 'Subject')?.value ?? '(no subject)';
        const from = headers.find((h) => h.name === 'From')?.value ?? sender;
        const date = headers.find((h) => h.name === 'Date')?.value ?? '';

        return {
          messageId: msg.id,
          subject,
          from,
          date,
          snippet: detail.data.snippet ?? '',
        };
      }),
    );
    for (const r of settled) {
      if (r) results.push(r);
    }
  }

  return results;
}

/**
 * Fetch the full body of an email and extract its text content.
 *
 * Prefers HTML parts (for later link extraction) but falls back to plain text.
 *
 * @param gmail     Authenticated Gmail API client.
 * @param messageId The Gmail message ID.
 * @returns An object with `html` (raw HTML if available) and `text` (plain text).
 */
export async function getEmailContent(
  gmail: gmail_v1.Gmail,
  messageId: string,
): Promise<{ html: string; text: string }> {
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const payload = response.data.payload;
  if (!payload) {
    throw new Error(
      `Gmail message ${messageId} has no payload — message may be deleted or inaccessible.`,
    );
  }

  let html = '';
  let text = '';

  function walkParts(parts: gmail_v1.Schema$MessagePart[] | undefined): void {
    if (!parts) return;
    for (const part of parts) {
      const mimeType = part.mimeType ?? '';
      if (mimeType === 'text/html' && part.body?.data) {
        html += decodeBase64Url(part.body.data);
      } else if (mimeType === 'text/plain' && part.body?.data) {
        text += decodeBase64Url(part.body.data);
      }
      // Recurse into multipart containers
      if (part.parts) {
        walkParts(part.parts);
      }
    }
  }

  // Single-part messages store the body directly on the payload
  const topMime = payload.mimeType ?? '';
  if (topMime === 'text/html' && payload.body?.data) {
    html = decodeBase64Url(payload.body.data);
  } else if (topMime === 'text/plain' && payload.body?.data) {
    text = decodeBase64Url(payload.body.data);
  }

  // Multi-part messages have nested parts
  walkParts(payload.parts);

  // If we have HTML but no extracted text, derive text from the HTML
  if (html && !text) {
    text = cheerio.load(html).text().replace(/\s+/g, ' ').trim();
  }

  return { html, text };
}

/**
 * Extract article/content URLs from an email's HTML body.
 *
 * Filters out common non-article links (unsubscribe, social media profiles,
 * email client links, tracking pixels, etc.).
 *
 * @param htmlContent Raw HTML string from the email body.
 * @returns Array of extracted links with their anchor text.
 */
export function extractLinksFromEmail(htmlContent: string): ExtractedLink[] {
  if (!htmlContent) return [];

  const $ = cheerio.load(htmlContent);
  const links: ExtractedLink[] = [];
  const seen = new Set<string>();

  // Domains and patterns to skip
  const skipPatterns = [
    /unsubscribe/i,
    /manage.preferences/i,
    /email.preferences/i,
    /view.in.browser/i,
    /view.online/i,
    /mailto:/i,
    /^#/,
    /javascript:/i,
  ];

  const skipDomains = [
    'facebook.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'linkedin.com',
    'youtube.com',
    'tiktok.com',
    'pinterest.com',
    'reddit.com',
    // Email service infrastructure
    'list-manage.com',
    'mailchimp.com',
    'campaign-archive.com',
    'sendgrid.net',
    'convertkit.com',
    'beehiiv.com',
  ];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href) return;

    // Skip empty, anchor-only, or very short links
    if (href.length < 10) return;

    // Skip links matching exclusion patterns
    if (skipPatterns.some((p) => p.test(href))) return;

    // Skip known non-article domains
    try {
      const hostname = new URL(href).hostname.toLowerCase();
      if (skipDomains.some((d) => hostname.includes(d))) return;
    } catch {
      // Not a valid URL, skip
      return;
    }

    // Deduplicate
    if (seen.has(href)) return;
    seen.add(href);

    const text = $(el).text().trim();
    // Only include links that have meaningful anchor text (likely article titles)
    if (text.length >= 5) {
      links.push({ url: href, text });
    }
  });

  return links;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode a base64url-encoded string (as used by the Gmail API for message bodies).
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}
