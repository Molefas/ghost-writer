# Ghost Writer Trik — Implementation Plan

> **Canonical progress tracker.** Update after completing each phase.

---

## Current Status

**Last completed phase**: Phase 1 (Foundation)
**Next action**: Execute Phase 2 (Blog Scraping & Inspirations)
**Working directory**: `/Users/ruimolefas/Code/trikhub-skills/ghost-writer/`
**Branch**: standalone repo (not inside monorepo)

### Progress Tracker

- [x] **Phase 0**: Copy plan + create `mcp_gap.md`
- [x] **Phase 1**: Foundation — scaffold, data model, source CRUD, voice/interests
- [ ] **Phase 2**: Blog Scraping & Inspirations — scraper, scorer, blog scan, inspiration search
- [ ] **Phase 3**: Content Creation Engine — article/LI/X generation, draft workflow
- [ ] **Phase 4**: Gmail Newsletter Integration — OAuth, email parsing, newsletter pipeline
- [ ] **Phase 5**: System Prompt & Polish — comprehensive prompt, error handling, classic prompts

---

## Meta-Instructions (ALWAYS ACTIVE)

1. **MCP-first**: Check MCP trikhub tools before reading package source code directly
2. **Log MCP gaps**: Append to `/docs/mcp_gap.md` with date and description
3. **Progress tracking**: Update checkboxes after completing each phase
4. **Commit after each phase**: `feat(ghost-writer): phase N — <description>`

### Session Resumption Protocol

1. Read this file to find current status
2. Check progress tracker for next unchecked phase
3. Read the phase deliverables from the full plan
4. Execute the phase, verify, commit, update progress tracker

---

## Architecture Overview

### Data Model

**Sources** — `source:<id>`, index at `index:sources`
- type: blog | article | newsletter
- url, email, name, addedAt, lastScanned

**Inspirations** — `insp:<id>`, index at `index:inspirations`
- sourceId, title, description, url, score (1-10), tags, addedAt

**Content** — `content:<id>`, index at `index:content`
- type: article | linkedin | x_post
- title, body, inspirationIds, status (draft|done), createdAt, updatedAt

### Storage Keys

```
source:<id>, index:sources
insp:<id>, index:inspirations
content:<id>, index:content
gmail:tokens
```

### Dependencies

@trikhub/sdk, @langchain/anthropic, @langchain/core, @langchain/langgraph, zod, cheerio, nanoid, googleapis

---

## Phase Details

See full plan at: `/Users/ruimolefas/Code/skill-poc-v2/docs/plans/2026-02-27-ghost-writer-design.md`
