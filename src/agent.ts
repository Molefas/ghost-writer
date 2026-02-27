import { ChatAnthropic } from '@langchain/anthropic';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { wrapAgent, transferBackTool } from '@trikhub/sdk';
import type { TrikContext } from '@trikhub/sdk';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { manageSources } from './tools/manage-sources.js';
import { readVoice } from './tools/read-voice.js';
import { readInterests } from './tools/read-interests.js';
import { scanBlog } from './tools/scan-blog.js';
import { searchInspirations } from './tools/search-inspirations.js';
import { getInspirationContent } from './tools/get-content.js';
import { createContent } from './tools/create-content.js';
import { updateContent } from './tools/update-content.js';
import { manageContent } from './tools/manage-content.js';
import { gmailAuth } from './tools/gmail-auth.js';
import { gmailSearch } from './tools/gmail-search.js';
import { scanNewsletters } from './tools/scan-newsletters.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const systemPrompt = readFileSync(join(__dirname, '../src/prompts/system.md'), 'utf-8');

export default wrapAgent((context: TrikContext) => {
  const model = new ChatAnthropic({
    modelName: 'claude-sonnet-4-20250514',
    anthropicApiKey: context.config.get('ANTHROPIC_API_KEY'),
  });

  const tools = [
    // Phase 1: Source management & profiles
    manageSources(context.storage),
    readVoice(),
    readInterests(),
    // Phase 2: Scraping & inspirations
    scanBlog(context.storage),
    searchInspirations(context.storage),
    getInspirationContent(context.storage),
    // Phase 3: Content creation
    createContent(context.storage),
    updateContent(context.storage),
    manageContent(context.storage),
    // Phase 4: Gmail integration
    gmailAuth(context.storage, context.config),
    gmailSearch(context.storage),
    scanNewsletters(context.storage),
    // Handoff escape
    transferBackTool,
  ];

  return createReactAgent({
    llm: model,
    tools,
    messageModifier: systemPrompt,
  });
});
