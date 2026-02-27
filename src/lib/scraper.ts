import * as cheerio from 'cheerio';

export interface DiscoveredArticle {
  title: string;
  url: string;
  description: string;
}

export async function discoverArticles(blogUrl: string): Promise<DiscoveredArticle[]> {
  const html = await fetchPage(blogUrl);
  const $ = cheerio.load(html);

  // Strategy 1: Check for RSS/Atom feed link
  const feedUrl = $('link[rel="alternate"][type="application/rss+xml"]').attr('href')
    ?? $('link[rel="alternate"][type="application/atom+xml"]').attr('href');

  if (feedUrl) {
    const absoluteFeedUrl = new URL(feedUrl, blogUrl).href;
    try {
      const articles = await parseRssFeed(absoluteFeedUrl);
      if (articles.length > 0) return articles;
    } catch {
      // Fall through to HTML extraction
    }
  }

  // Strategy 2: HTML heuristic extraction
  return extractArticlesFromHtml($, blogUrl);
}

export async function fetchArticleContent(articleUrl: string): Promise<string> {
  const html = await fetchPage(articleUrl);
  const $ = cheerio.load(html);

  // Try content selectors in priority order
  const selectors = [
    'article',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.blog-post-content',
    '[role="main"]',
    'main',
  ];

  for (const selector of selectors) {
    const el = $(selector);
    if (el.length > 0) {
      return cleanText(el.first().text());
    }
  }

  // Fallback: largest container with most <p> children
  let bestEl = $('body');
  let bestPCount = 0;
  $('div, section').each((_, el) => {
    const pCount = $(el).find('> p').length;
    if (pCount > bestPCount) {
      bestPCount = pCount;
      bestEl = $(el);
    }
  });

  return cleanText(bestEl.text());
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GhostWriter/1.0 (content-curation-bot)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function parseRssFeed(feedUrl: string): Promise<DiscoveredArticle[]> {
  const xml = await fetchPage(feedUrl);
  const $ = cheerio.load(xml, { xml: true });
  const articles: DiscoveredArticle[] = [];

  // RSS 2.0
  $('item').each((_, el) => {
    const title = $(el).find('title').first().text().trim();
    const link = $(el).find('link').first().text().trim();
    const desc = $(el).find('description').first().text().trim();
    if (title && link) {
      articles.push({
        title,
        url: link,
        description: stripHtml(desc).slice(0, 300),
      });
    }
  });

  // Atom
  if (articles.length === 0) {
    $('entry').each((_, el) => {
      const title = $(el).find('title').first().text().trim();
      const link = $(el).find('link[rel="alternate"]').attr('href')
        ?? $(el).find('link').attr('href')
        ?? '';
      const summary = $(el).find('summary').first().text().trim()
        || $(el).find('content').first().text().trim();
      if (title && link) {
        articles.push({
          title,
          url: link,
          description: stripHtml(summary).slice(0, 300),
        });
      }
    });
  }

  return articles;
}

function extractArticlesFromHtml($: cheerio.CheerioAPI, baseUrl: string): DiscoveredArticle[] {
  const articles: DiscoveredArticle[] = [];
  const seen = new Set<string>();

  const linkSelectors = [
    'article a[href]',
    '.post-title a',
    '.entry-title a',
    'h2 a[href]',
    'h3 a[href]',
  ];

  for (const selector of linkSelectors) {
    $(selector).each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      const absoluteUrl = new URL(href, baseUrl).href;
      if (seen.has(absoluteUrl)) return;
      // Skip external links and anchors
      try {
        const linkHost = new URL(absoluteUrl).hostname;
        const baseHost = new URL(baseUrl).hostname;
        if (linkHost !== baseHost) return;
      } catch {
        return;
      }

      seen.add(absoluteUrl);
      const title = $(el).text().trim();
      if (!title || title.length < 5) return;

      // Try to find a nearby description
      const parent = $(el).closest('article, .post, .entry, li, div');
      const desc = parent.find('p, .excerpt, .summary').first().text().trim();

      articles.push({
        title,
        url: absoluteUrl,
        description: desc.slice(0, 300),
      });
    });
  }

  return articles;
}

function stripHtml(html: string): string {
  return cheerio.load(html).text().trim();
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
