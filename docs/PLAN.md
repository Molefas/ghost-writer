# Ghost Writer Trik — Implementation Plan

> **Canonical progress tracker.** Update after completing each phase.

---

## Current Status

**Last completed phase**: Phase 5 (System Prompt & Polish)
**Next action**: All phases complete — ready for publishing
**Working directory**: `/Users/ruimolefas/Code/trikhub-skills/ghost-writer/`
**Branch**: standalone repo (not inside monorepo)

### Progress Tracker

- [x] **Phase 0**: Copy plan + create `mcp_gap.md`
- [x] **Phase 1**: Foundation — scaffold, data model, source CRUD, voice/interests
- [x] **Phase 2**: Blog Scraping & Inspirations — scraper, scorer, blog scan, inspiration search
- [x] **Phase 3**: Content Creation Engine — article/LI/X generation, draft workflow
- [x] **Phase 4**: Gmail Newsletter Integration — OAuth, email parsing, newsletter pipeline
- [x] **Phase 5**: System Prompt & Polish — comprehensive prompt, error handling, classic prompts

---

## Meta-Instructions (ALWAYS ACTIVE)

1. **MCP-first**: Check MCP trikhub tools before reading package source code directly
2. **Log MCP gaps**: Append to `/docs/mcp_gap.md` with date and description
3. **Progress tracking**: Update checkboxes after completing each phase
4. **Commit after each phase**: `feat(ghost-writer): phase N — <description>`

### Session Resumption Protocol

1. Read this file to find current status
2. Check progress tracker for next unchecked phase
3. Read the phase deliverables below
4. Read Architecture Overview for data model and patterns
5. Execute the phase, verify, commit, update progress tracker

---

## Project Context

### What is this?

A **TrikHub conversational trik** called `ghost-writer` — a content automation assistant. TrikHub is a platform where AI agents consume composable capabilities ("triks"). This trik helps users:

1. **Manage sources**: Blog URLs (with multiple articles), single article URLs, Gmail newsletter senders
2. **Curate inspirations**: Uniform data model extracted from all sources — title, description, URL, relevance score (1-10)
3. **Create content**: Articles, LinkedIn posts, X posts — generated from inspirations in the user's writing voice
4. **Iterate on drafts**: Multi-turn conversation to refine content until marked "done"

### Why conversational mode?

TrikHub enforces **TDPS (Type-Directed Privilege Separation)** — tool-mode triks can only return constrained strings (enum/pattern/format). Since this trik outputs free-form articles and posts, it MUST be conversational mode where the LLM's response goes directly to the user without TDPS constraints on the text itself.

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Conversational mode** | Free-form text output can't satisfy TDPS tool-mode constraints |
| **Tools as factory functions** | Close over `storage` from `TrikContext`; agent created once per lifecycle |
| **Index arrays in storage** | Ordering control + batch retrieval via `getMany`; simple for expected scale |
| **LLM generates content, tools gather materials** | Tools stay TDPS-safe; creative work is the LLM's job |
| **fetch() + Cheerio for scraping** | No binary deps, lightweight, sufficient for static blog content |
| **Gmail OAuth with localhost redirect** | Google deprecated OOB flow; user copies code from browser URL bar |
| **nanoid for IDs** | URL-safe, short, collision-resistant |
| **voice.md + interests.md as files** | Manually edited by user in trik's `src/data/` directory |

### TrikHub Patterns This Trik Uses

**Entry point**:
```typescript
export default wrapAgent((context: TrikContext) => {
  const model = new ChatAnthropic({
    modelName: 'claude-sonnet-4-20250514',
    anthropicApiKey: context.config.get('ANTHROPIC_API_KEY'),
  });
  const tools = [myTool(context.storage), transferBackTool];
  return createReactAgent({ llm: model, tools, messageModifier: systemPrompt });
});
```

**Tool factory pattern** (tools needing storage close over it):
```typescript
export function myTool(storage: TrikStorageContext) {
  return tool(async (input) => { /* uses storage */ }, { name: 'myTool', schema: z.object({...}) });
}
```

**Storage API**:
```typescript
interface TrikStorageContext {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
  getMany(keys: string[]): Promise<Map<string, unknown>>;
  setMany(entries: Record<string, unknown>): Promise<void>;
}
```

---

## Architecture Overview

### File Structure

```
/Users/ruimolefas/Code/trikhub-skills/ghost-writer/
├── manifest.json                    # v2 manifest with 12 tools
├── package.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── agent.ts                     # Entry: wrapAgent() factory
│   ├── prompts/
│   │   └── system.md                # Comprehensive system prompt
│   ├── tools/                       # LangChain tools (one per file)
│   │   ├── manage-sources.ts        # Phase 1
│   │   ├── read-voice.ts            # Phase 1
│   │   ├── read-interests.ts        # Phase 1
│   │   ├── scan-blog.ts             # Phase 2
│   │   ├── search-inspirations.ts   # Phase 2
│   │   ├── get-content.ts           # Phase 2
│   │   ├── create-content.ts        # Phase 3
│   │   ├── update-content.ts        # Phase 3
│   │   ├── manage-content.ts        # Phase 3
│   │   ├── gmail-auth.ts            # Phase 4
│   │   ├── gmail-search.ts          # Phase 4
│   │   └── scan-newsletters.ts      # Phase 4
│   ├── lib/
│   │   ├── types.ts                 # Source, Inspiration, Content interfaces
│   │   ├── storage.ts               # Index-backed collection helpers
│   │   ├── scraper.ts               # fetch() + Cheerio (Phase 2)
│   │   ├── gmail.ts                 # Gmail API client (Phase 4)
│   │   └── scorer.ts                # Interest-based scoring (Phase 2)
│   └── data/
│       ├── voice.md                 # User's writing style (manual)
│       └── interests.md             # User's topic interests (manual)
└── dist/                            # Compiled output
```

### Data Model

**Sources** — storage key `source:<id>`, index at `index:sources`
```typescript
interface Source {
  id: string;          // "src_<nanoid>"
  type: 'blog' | 'article' | 'newsletter';
  url?: string;        // for blog/article
  email?: string;      // for newsletter
  name: string;        // human-readable
  addedAt: string;     // ISO8601
  lastScanned: string | null;
}
```

**Inspirations** — storage key `insp:<id>`, index at `index:inspirations`
```typescript
interface Inspiration {
  id: string;          // "insp_<nanoid>"
  sourceId: string;
  title: string;
  description: string;
  url: string;
  score: number;       // 1-10 based on user interests
  addedAt: string;     // ISO8601
  tags: string[];
}
```

**Content** — storage key `content:<id>`, index at `index:content`
```typescript
interface Content {
  id: string;          // "cnt_<nanoid>"
  type: 'article' | 'linkedin' | 'x_post';
  title: string;
  body: string;
  inspirationIds: string[];
  status: 'draft' | 'done';
  createdAt: string;   // ISO8601
  updatedAt: string;   // ISO8601
}
```

### Storage Key Constants
```typescript
const KEYS = {
  source: (id: string) => `source:${id}`,
  inspiration: (id: string) => `insp:${id}`,
  content: (id: string) => `content:${id}`,
  sourceIndex: 'index:sources',
  inspirationIndex: 'index:inspirations',
  contentIndex: 'index:content',
  gmailTokens: 'gmail:tokens',
};
```

### Content Creation Flow

1. User requests content -> LLM calls `createContent` (gathers source material + voice)
2. Tool returns materials -> LLM generates content in its response to user
3. LLM calls `updateContent` to persist the generated text as draft
4. User iterates with feedback -> LLM revises -> calls `updateContent` again
5. User approves -> LLM calls `manageContent` with `setStatus: "done"`

### Manifest Tools Summary

All logSchema strings use `enum` or `maxLength` (TDPS compliance).

| Tool | logTemplate | Key logSchema fields |
|------|-------------|---------------------|
| `manageSources` | `Source {{action}}: {{sourceType}} "{{sourceName}}"` | action: enum[added,removed,listed,updated], sourceType: enum[blog,article,newsletter], sourceName: maxLength 100 |
| `scanBlog` | `Scanned "{{blogName}}": {{articleCount}} articles` | blogName: maxLength 100, articleCount: integer |
| `scanNewsletters` | `Scanned newsletters: {{emailCount}} emails` | emailCount: integer, senderCount: integer |
| `searchInspirations` | `Searched: {{resultCount}} results` | resultCount: integer, searchCriteria: maxLength 150 |
| `getInspirationContent` | `Fetched "{{inspirationTitle}}" ({{contentLength}} chars)` | inspirationTitle: maxLength 150, contentLength: integer |
| `createContent` | `Created {{contentType}} draft: "{{contentTitle}}"` | contentType: enum[article,linkedin,x_post], contentTitle: maxLength 150 |
| `updateContent` | `Updated {{contentType}}: "{{contentTitle}}"` | contentType: enum[article,linkedin,x_post], contentTitle: maxLength 150 |
| `manageContent` | `Content {{action}}: {{resultCount}} pieces` | action: enum[listed,status_changed,deleted], resultCount: integer |
| `readVoice` | `Loaded voice profile ({{charCount}} chars)` | charCount: integer |
| `readInterests` | `Loaded interests ({{charCount}} chars)` | charCount: integer |
| `gmailAuth` | `Gmail auth: {{authStatus}}` | authStatus: enum[initiated,completed,failed,already_authenticated] |
| `gmailSearch` | `Gmail: {{resultCount}} emails from "{{senderName}}"` | resultCount: integer, senderName: maxLength 100 |

### Config

- **Required**: `ANTHROPIC_API_KEY` — for the trik's internal LLM
- **Optional**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — for Gmail OAuth

---

## Phase 1: Foundation (COMPLETED)

**Goal**: Scaffold project, implement data model, source management, voice/interests reading.

### Deliverables

- [x] 1.1 Create project directory + `git init`
- [x] 1.2 `manifest.json` — Full v2 manifest with all 12 tools
- [x] 1.3 `package.json` + `tsconfig.json` + `.gitignore`
- [x] 1.4 `src/lib/types.ts` — Source, Inspiration, Content TypeScript interfaces
- [x] 1.5 `src/lib/storage.ts` — Index helpers
- [x] 1.6 `src/agent.ts` — wrapAgent() factory
- [x] 1.7 `src/tools/manage-sources.ts` — Full CRUD
- [x] 1.8 `src/tools/read-voice.ts`
- [x] 1.9 `src/tools/read-interests.ts`
- [x] 1.10 `src/data/voice.md` + `src/data/interests.md` — Placeholders
- [x] 1.11 `src/prompts/system.md` — Initial system prompt
- [x] 1.12 Install dependencies, verify `tsc` compiles

---

## Phase 2: Blog Scraping & Inspirations (COMPLETED)

**Goal**: Blog crawling, article discovery, interest-based scoring, inspiration search/listing.

### Deliverables

- [x] 2.1 `src/lib/scraper.ts` — `discoverArticles(url)` + `fetchArticleContent(url)`
- [x] 2.2 `src/lib/scorer.ts` — `scoreInspiration(title, desc, interestsContent)`
- [x] 2.3 `src/tools/scan-blog.ts` — Discover articles, deduplicate, score, create inspirations
- [x] 2.4 `src/tools/search-inspirations.ts` — Search by query, tags, minScore, source, date, limit
- [x] 2.5 `src/tools/get-content.ts` — Lazy-fetch full article text
- [x] 2.6 Update system prompt

### Scraping Strategy

1. **RSS/Atom first**: Check `<link rel="alternate" type="application/rss+xml">` in page head
2. **HTML fallback**: Use selectors `article a[href]`, `.post-title a`, `.entry-title a`, `h2 a`, `h3 a`
3. **Dedup**: Compare normalized URLs against existing inspirations
4. **Content extraction**: `article`, `.post-content`, `.entry-content`, `[role="main"]`, fallback largest div

---

## Phase 3: Content Creation Engine (COMPLETED)

**Goal**: Article/LinkedIn/X post generation, draft workflow, iteration cycle.

### Deliverables

- [x] 3.1 `src/tools/create-content.ts` — Gather materials, create draft record, return materials for LLM
- [x] 3.2 `src/tools/update-content.ts` — Save/update draft body, update timestamp
- [x] 3.3 `src/tools/manage-content.ts` — List/filter, change status, delete
- [x] 3.4 Update system prompt with content creation workflow and type guidelines

### Content Type Guidelines

| Type | Length | Style |
|------|--------|-------|
| Article | 800-1500 words | Long-form, structured with headers, based on voice |
| LinkedIn | 150-300 words | Hook opening, professional tone, call-to-action |
| X Post | < 280 chars | Punchy, shareable, conversational |

---

## Phase 4: Gmail Newsletter Integration

**Goal**: OAuth flow, email search, newsletter-to-inspiration pipeline.

**Prerequisite**: Phase 3 complete

### Deliverables

- [x] 4.1 `src/lib/gmail.ts` — Gmail API client: OAuth2, auth URL gen, code exchange, token storage/refresh, email search, content extraction
- [x] 4.2 `src/tools/gmail-auth.ts` — Replace stub: conversational OAuth (generate URL -> user pastes code -> exchange tokens)
- [x] 4.3 `src/tools/gmail-search.ts` — Replace stub: search emails by sender
- [x] 4.4 `src/tools/scan-newsletters.ts` — Replace stub: scan Gmail for newsletters, extract links, deduplicate, score, create inspirations
- [x] 4.5 Update system prompt with Gmail setup and newsletter workflows

### OAuth Flow (Conversational)

1. User: "set up newsletter access" -> LLM calls `gmailAuth()`
2. Tool checks config for `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (error if missing)
3. Tool checks storage for existing tokens (return "already_authenticated" if valid)
4. Tool generates auth URL with `redirect_uri=http://localhost`, scope `gmail.readonly`
5. LLM presents URL -> user authorizes -> browser shows `http://localhost?code=xxx` (doesn't load)
6. User copies code, pastes it -> LLM calls `gmailAuth({ authCode: "xxx" })`
7. Tool exchanges code for tokens, stores at `gmail:tokens` -> returns "completed"

### Verification

```bash
cd /Users/ruimolefas/Code/trikhub-skills/ghost-writer
npx tsc                                          # Must compile clean
npx trik lint .                                   # Accept node:fs warning only
# Manual: configure Google OAuth credentials -> run auth flow -> verify tokens stored
# Manual: add newsletter source -> scan -> verify inspirations created from emails
# Manual: re-scan -> verify deduplication
```

---

## Phase 5: System Prompt & Polish

**Goal**: Comprehensive system prompt, error handling, classic prompts support.

**Prerequisite**: Phase 4 complete (all features functional)

### Deliverables

- [x] 5.1 Comprehensive `src/prompts/system.md` covering all 12 tools, workflows, formatting, error recovery
- [x] 5.2 Error handling in all tools: failed fetches, expired OAuth, empty storage, invalid inputs
- [x] 5.3 Finalize `docs/mcp_gap.md` with all discovered documentation gaps
- [x] 5.4 Update progress tracker to all complete

### Classic Prompts the System Prompt Must Handle

| User says | Trik does |
|-----------|-----------|
| "Find me articles on X topic" | `searchInspirations` with query |
| "Grab article X and Y and merge..." | `createContent` with multiple inspirations |
| "Check for new articles or newsletters" | `scanBlog` + `scanNewsletters` for all sources |
| "Make me a top 10 of the last month" | `searchInspirations` with date filter + limit |
| "Any trends in the last 2 months?" | `searchInspirations` with date range, analyze scores/tags |
| "Make me a LI post on Y based on Z" | `createContent` type=linkedin |
| "Take this link, turn into X post" | `manageSources` add + `createContent` type=x_post |
| "What are the 8-9 ranked inspirations?" | `searchInspirations` sorted by score desc |
| "Any 10-rank inspirations this week?" | `searchInspirations` minScore=10, date filter |

### System Prompt Key Principles

- **Never expose IDs** — describe by title/name, resolve natural language references
- **Always load voice before creating** — enforce in prompt
- **Summarize, don't dump** — curated views over raw data
- **Guide OAuth conversationally** — step by step with clear instructions
- **Transfer back when outside domain** — explicit criteria
