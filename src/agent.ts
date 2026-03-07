import { ChatAnthropic } from '@langchain/anthropic';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { wrapAgent, transferBackTool } from '@trikhub/sdk';
import { KEYS } from './lib/storage.js';
import type { TrikContext } from '@trikhub/sdk';

import { manageSources } from './tools/manage-sources.js';
import { manageVoice } from './tools/manage-voice.js';
import { manageInterests } from './tools/manage-interests.js';
import { scanBlog } from './tools/scan-blog.js';
import { searchInspirations } from './tools/search-inspirations.js';
import { getInspirationContent } from './tools/get-content.js';
import { createContent } from './tools/create-content.js';
import { updateContent } from './tools/update-content.js';
import { manageContent } from './tools/manage-content.js';
import { manageInspirations } from './tools/manage-inspirations.js';
import { gmailAuth } from './tools/gmail-auth.js';
import { gmailSearch } from './tools/gmail-search.js';
import { scanNewsletters } from './tools/scan-newsletters.js';
import { systemPrompt } from './prompts/system.js';

export default wrapAgent((context: TrikContext) => {
  const model = new ChatAnthropic({
    modelName: 'claude-sonnet-4-20250514',
    anthropicApiKey: context.config.get('ANTHROPIC_API_KEY'),
  });

  const tools = [
    // Source management & profiles
    manageSources(context.storage),
    manageVoice(context.storage),
    manageInterests(context.storage),
    // Scraping & inspirations
    scanBlog(context.storage),
    searchInspirations(context.storage),
    manageInspirations(context.storage),
    getInspirationContent(context.storage),
    // Content creation
    createContent(context.storage),
    updateContent(context.storage),
    manageContent(context.storage),
    // Gmail integration
    gmailAuth(context.storage, context.config),
    gmailSearch(context.storage, context.config),
    scanNewsletters(context.storage, context.config),
    // Handoff escape
    transferBackTool,
  ];

  // Write config status for UI dashboard
  const configStatus = {
    ANTHROPIC_API_KEY: context.config.has('ANTHROPIC_API_KEY'),
    GOOGLE_CLIENT_ID: context.config.has('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: context.config.has('GOOGLE_CLIENT_SECRET'),
  };
  context.storage.set(KEYS.configStatus, configStatus);

  return createReactAgent({
    llm: model,
    tools,
    messageModifier: systemPrompt,
  });
});
