# Ghost Writer

Content automation trik for [TrikHub](https://trikhub.com) — manage sources, curate article inspirations, and create articles, LinkedIn posts, and X posts in your writing voice.
This is a demo trik to showcase some capabilitites and not a production-level trik, although it can easily be turned into one - it's on the backlog.

## Features

- **Source management** — Add blogs, individual articles, and newsletter senders as content sources
- **Blog scanning** — Discover articles via RSS feeds or HTML link extraction, with automatic deduplication
- **Newsletter integration** — Connect Gmail to scan newsletter emails and extract article links
- **Relevance scoring** — Every inspiration is scored 1–10 based on your configured topic interests
- **Content creation** — Generate articles (800–1500 words), LinkedIn posts (150–300 words), and X posts (<280 chars)
- **Voice matching** — All content is written in your configured writing style
- **Draft management** — Iterate on drafts with revision cycles, then mark as done

## Quick Start

1. Install the trik:

   ```bash
   trik install @trikhub/ghost-writer
   ```

2. Add your Anthropic API key to `~/.trikhub/secrets.json`:

   ```json
   {
     "ANTHROPIC_API_KEY": "sk-ant-..."
   }
   ```

3. Customize your writing voice in `src/data/voice.md` — describe your tone, style preferences, and any writing rules.

4. Set your topic interests in `src/data/interests.md` — list primary and secondary topics so inspirations get scored by relevance.

5. Start a conversation and add your first source:

   > "Add https://example.com/blog as a blog source and scan it for articles"

## Dashboard UI

Ghost Writer includes a web dashboard for browsing sources, inspirations, and content visually.

### Launch the UI

After installing the trik, start the dashboard with:

```bash
npx ghost-writer-ui
```

Or from the project root using npm scripts:

```bash
npm run ui          # dev server (http://localhost:3000)
npm run ui:build    # production build
npm run ui:start    # start production server
```

The dashboard reads directly from Ghost Writer's storage at `~/.trikhub/storage/storage.db` and provides pages for:

- **Sources** — view and manage blog/newsletter sources
- **Inspirations** — browse scored inspirations, filter by score/tags/date
- **Content** — read drafts and finished content with markdown rendering
- **Settings** — configure Gmail connection and view config status

*Note:* For now the UI has to be manually started, which is not a limitation, simply outside the scope of this Demo Trik.

## Gmail Setup (Optional)

Gmail integration lets you scan newsletter emails for article links. Skip this if you only use blog sources.

### 1. Create a Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Gmail API** under APIs & Services

### 2. Create OAuth credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Add the gmail.readonly scope
5. Add authorized redirect URI: `http://127.0.0.1:9874`
6. Copy the **Client ID** and **Client Secret**
7. Add your email as a test user in the Audience tab

### 3. Add credentials to config

Add to `~/.trikhub/secrets.json`:

```json
{
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "GOOGLE_CLIENT_ID": "123456789-abc.apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "GOCSPX-..."
}
```

### 4. Authenticate

Tell Ghost Writer to connect Gmail:

> "Connect my Gmail for newsletters"

It will open a browser window for Google authorization. After you approve, the tokens are saved automatically.

## Example Prompts

### Source Management

- "Add https://blog.example.com as a blog source"
- "Add this article: https://example.com/great-post"
- "Add newsletters@example.com as a newsletter source"
- "Show me all my sources"
- "Remove that blog I added"

### Scanning

- "Scan all my blog sources for new articles"
- "Check my newsletters for new content"
- "Scan the Example Blog for updates"

### Browsing Inspirations

- "Show me the top 10 inspirations"
- "Find articles about AI agents"
- "What are my highest-scored inspirations from last week?"
- "Show articles tagged with 'productivity'"
- "Any trends in my inspirations from the last 2 months?"

### Content Creation

- "Write a LinkedIn post about the future of AI agents"
- "Create an article from my top 3 inspirations"
- "Turn this link into an X post: https://example.com/article"
- "Write an article combining the AI agents piece and the productivity one"

### Content Management

- "Show me my drafts"
- "Mark that LinkedIn post as done"
- "Show all my finished articles"
- "Delete the X post draft"

### Revisions

- "Make the opening more punchy"
- "Shorten this to under 250 words"
- "Add a call-to-action at the end"
- "Rewrite in a more conversational tone"

## Voice & Interests

### Voice Profile (`src/data/voice.md`)

Describes how Ghost Writer should write. Include things like:

- **Tone** — conversational, formal, witty, direct
- **Structure preferences** — short paragraphs, use of headers, bullet points
- **Vocabulary** — technical level, jargon usage, preferred phrases
- **Personality** — humor style, level of authority, empathy

Example:

```markdown
## Tone
Direct and conversational. Write like you're explaining to a smart colleague over coffee.

## Structure
- Short paragraphs (2-3 sentences max)
- Use headers to break up longer pieces
- Lead with the insight, then support it

## Rules
- No corporate jargon ("leverage", "synergize")
- Use concrete examples over abstract statements
- End with a forward-looking question or takeaway
```

### Topic Interests (`src/data/interests.md`)

Controls how inspirations are scored for relevance. Higher scores = more relevant to your interests.

Example:

```markdown
## Primary Interests
- AI agents and autonomous systems
- Developer tools and productivity
- Technical writing and content strategy

## Secondary Interests
- Open source community building
- API design patterns
- Startup engineering culture
```

## Content Types

| Type | Length | Style |
|------|--------|-------|
| **Article** | 800–1500 words | Long-form with headers, intro, body sections, conclusion |
| **LinkedIn Post** | 150–300 words | Strong hook, professional but conversational, ends with CTA |
| **X Post** | < 280 chars | Punchy, shareable, one clear idea |

## Configuration Reference

Add keys to `~/.trikhub/secrets.json`:

| Key | Required | Description |
|-----|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Ghost Writer's internal LLM |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (for Gmail newsletter scanning) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret (for Gmail newsletter scanning) |

When using Gmail, register `http://127.0.0.1:9874` as the authorized redirect URI in your Google Cloud Console.
