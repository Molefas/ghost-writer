# Ghost Writer — CLAUDE.md

## What is TrikHub?

TrikHub is a modular AI agent framework for building, publishing, and composing specialized agents called **triks**. Triks plug into larger LangChain/LangGraph agents via a gateway that handles routing, storage isolation, and tool exposure.

Key concepts:
- **Trik** — A self-contained agent module with a `manifest.json`, entry point, and optional tools/storage/config
- **Gateway** — Runtime that loads triks, manages handoffs between agents, and provides storage/config injection
- **Two modes**: `conversational` (multi-turn LLM agent with system prompt) and `tool` (structured I/O, no LLM)
- **Distribution** — Triks are published to the TrikHub registry (`trik install @scope/name`), NOT npm/PyPI
- **MCP server** — Available at `trikhub` with manifest schema docs (`trikhub://docs/manifest-schema`)

## What is Ghost Writer?

Ghost Writer is a **conversational trik** (v1.0.0) that automates content creation workflows. It helps users manage content sources (blogs, newsletters), curate article inspirations with relevance scoring, and generate articles, LinkedIn posts, and X posts in a configurable writing voice.

## Commands

```bash
npm run build     # Compile TypeScript (tsc)
npm run clean     # Remove dist/
```

No test suite exists yet. After building, the trik is consumed via a TrikHub gateway (local-playground or `enhance()`).

## Architecture

### Entry Point

`src/agent.ts` — Uses `wrapAgent()` factory from `@trikhub/sdk`. Creates a LangGraph ReAct agent with Claude Sonnet 4, 12 tools + `transferBackTool`, and a system prompt loaded from `src/prompts/system.ts`.

### Data Model

Three entity types stored in TrikHub's persistent key-value storage (SQLite):

| Entity | Key Pattern | Index Key | ID Format | Interface |
|--------|------------|-----------|-----------|-----------|
| Source | `source:<id>` | `index:sources` | `src_<nanoid(10)>` | `src/lib/types.ts:Source` |
| Inspiration | `insp:<id>` | `index:inspirations` | `insp_<nanoid(10)>` | `src/lib/types.ts:Inspiration` |
| Content | `content:<id>` | `index:content` | `cnt_<nanoid(12)>` | `src/lib/types.ts:Content` |

Gmail OAuth tokens stored at key `gmail:tokens`.

### Storage Pattern

Index-backed collections in `src/lib/storage.ts`. Each entity type has an index array (`[id1, id2, ...]`). Helpers: `addToIndex()`, `removeFromIndex()`, `getAll()`, `getById()`. Batch retrieval via `storage.getMany()`.

### Tools (12 total)

| Tool | File | Dependencies | Purpose |
|------|------|-------------|---------|
| `manageSources` | `src/tools/manage-sources.ts` | storage | CRUD for content sources (blog/article/newsletter) |
| `manageVoice` | `src/tools/manage-voice.ts` | storage | Read or update writing voice profile |
| `manageInterests` | `src/tools/manage-interests.ts` | storage | Read or update topic interests for relevance scoring |
| `scanBlog` | `src/tools/scan-blog.ts` | storage | Discovers articles via RSS/HTML, creates scored inspirations |
| `searchInspirations` | `src/tools/search-inspirations.ts` | storage | Multi-criteria inspiration search (query, score, tags, date) |
| `getInspirationContent` | `src/tools/get-content.ts` | storage | Lazy-fetches full article text from URL |
| `createContent` | `src/tools/create-content.ts` | storage | Gathers materials + voice, creates empty draft record |
| `updateContent` | `src/tools/update-content.ts` | storage | Persists generated content body text |
| `manageContent` | `src/tools/manage-content.ts` | storage | List/filter/setStatus/delete content pieces |
| `gmailAuth` | `src/tools/gmail-auth.ts` | storage, config | OAuth 2.0 flow with localhost redirect capture |
| `gmailSearch` | `src/tools/gmail-search.ts` | storage, config | Search Gmail by sender |
| `scanNewsletters` | `src/tools/scan-newsletters.ts` | storage, config | Extract article links from newsletter emails |

Tools are factory functions that close over `context.storage` (and `context.config` for Gmail tools).

### Supporting Libraries

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | TypeScript interfaces: Source, Inspiration, Content |
| `src/lib/storage.ts` | Index helpers, KEYS constants |
| `src/lib/scraper.ts` | RSS/Atom feed detection, HTML article discovery, content extraction (Cheerio) |
| `src/lib/scorer.ts` | Interest-based relevance scoring (1-10 scale from keyword matching) |
| `src/lib/gmail.ts` | OAuth token management, email fetching, link extraction with domain filtering |

## Manifest Structure

`manifest.json` follows TrikHub schema v2. Key fields:
- `agent.mode: "conversational"` with `handoffDescription` for gateway routing
- `agent.systemPromptFile: "./src/prompts/system.ts"`
- `tools` — Each declares `logTemplate` + `logSchema` (required for conversational mode; security-constrained string types)
- `capabilities.storage.enabled: true` (only storage — no filesystem or shell)
- `config.required`: `ANTHROPIC_API_KEY`; `config.optional`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Log Schema Security Rules

String fields in `logSchema` MUST have one of: `enum`, `maxLength`, `pattern`, or `format`. This prevents free-form user content in logs. Integer/number/boolean are always safe.

## Key Data Flows

### Blog Scanning
`manageSources(add)` → `scanBlog(sourceId)` → `discoverArticles()` (RSS first, HTML fallback) → `scrapeArticleMeta()` → `scoreInspiration()` → create Inspiration records

### Newsletter Scanning
`manageSources(add, type=newsletter)` → `gmailAuth()` → `scanNewsletters()` → `searchEmails()` → `extractLinksFromEmail()` → filter non-article links → `scoreInspiration()` → create Inspiration records

### Content Creation
`createContent(type, title, inspirationIds)` → fetch inspiration records + lazy-load article content → load voice from storage → return materials to LLM → LLM generates → `updateContent(contentId, body)` → iterate → `manageContent(setStatus=done)`

### Onboarding (First Run)
Agent calls `manageVoice(read)` + `manageInterests(read)` → if either empty → conversational onboarding collects voice profile then interests → saves via `manageVoice(update)` / `manageInterests(update)` → proceeds normally

## Configuration

Required in `~/.trikhub/secrets.json`:
```json
{
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "GOOGLE_CLIENT_ID": "...apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "GOCSPX-..."
}
```

Gmail config is optional — only needed for newsletter scanning.

## Dependencies

- `@trikhub/sdk` (^0.17.0) — TrikHub integration (`wrapAgent`, `transferBackTool`, `TrikContext`)
- `@langchain/anthropic` (^0.3.0) — Claude model binding
- `@langchain/core` (^0.3.0) — Tool base classes
- `@langchain/langgraph` (^0.2.0) — ReAct agent
- `googleapis` (^140.0.0) — Gmail API
- `cheerio` (^1.0.0) — HTML/XML parsing for scraping
- `zod` (^3.25.0) — Tool input schema validation
- `nanoid` (^5.0.0) — URL-safe ID generation

## File Structure

```
src/
├── agent.ts                    # wrapAgent() entry point
├── prompts/system.ts           # System prompt with onboarding and workflow patterns
├── tools/                      # 12 LangChain tool factories
│   ├── manage-sources.ts
│   ├── manage-voice.ts
│   ├── manage-interests.ts
│   ├── scan-blog.ts
│   ├── search-inspirations.ts
│   ├── get-content.ts
│   ├── create-content.ts
│   ├── update-content.ts
│   ├── manage-content.ts
│   ├── gmail-auth.ts
│   ├── gmail-search.ts
│   └── scan-newsletters.ts
├── lib/
│   ├── types.ts                # Source, Inspiration, Content interfaces
│   ├── storage.ts              # Index helpers, KEYS constants
│   ├── scraper.ts              # RSS/HTML scraping with Cheerio
│   ├── scorer.ts               # Interest-based relevance scoring
│   └── gmail.ts                # OAuth, token refresh, email parsing
dist/                           # Compiled output (committed for publishing)
docs/
├── PLAN.md                     # Implementation roadmap (5 phases, all complete)
└── mcp_gap.md                  # TrikHub MCP documentation gaps
manifest.json                   # TrikHub v2 manifest
```

## Known Issues & Gaps

From `docs/mcp_gap.md`:
1. `wrapAgent` factory pattern was underdocumented in MCP (now in schema docs)
2. `TrikStorageContext` API not fully surfaced in MCP tools
3. OAuth flow patterns for triks not documented in MCP
4. System prompt loading pattern not shown in scaffolds (now documented)

## Development Notes

- `dist/` is committed for TrikHub publishing (triks are not npm packages)
- After any `src/` change, run `npm run build` and commit both `src/` and `dist/`
- The trik runs inside a TrikHub gateway — test via local-playground at `~/Code/skill-poc-v2/examples/js/local-playground/`
- Gateway SQLite storage lives at `~/.trikhub/storage/storage.db`
- Node.js >= 20 required
