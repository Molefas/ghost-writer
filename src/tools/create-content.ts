import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TrikStorageContext } from '@trikhub/sdk';
import type { Content, Inspiration } from '../lib/types.js';
import { KEYS, addToIndex, getById } from '../lib/storage.js';
import { fetchArticleContent } from '../lib/scraper.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createContent(storage: TrikStorageContext) {
  return tool(
    async (input) => {
      // Load voice profile
      const voicePath = join(__dirname, '../../src/data/voice.md');
      let voice = '';
      try {
        voice = readFileSync(voicePath, 'utf-8');
      } catch {
        // voice.md missing — proceed without it
      }

      // Fetch inspiration details and content
      const materials: Array<{
        title: string;
        description: string;
        url: string;
        content: string;
      }> = [];

      for (const id of input.inspirationIds) {
        const insp = await getById<Inspiration>(
          storage,
          KEYS.inspiration,
          id,
        );
        if (!insp) continue;

        let content = '';
        try {
          content = await fetchArticleContent(insp.url);
        } catch {
          content = `[Failed to fetch content from ${insp.url}]`;
        }

        materials.push({
          title: insp.title,
          description: insp.description,
          url: insp.url,
          content,
        });
      }

      if (materials.length === 0) {
        return JSON.stringify({
          contentType: input.type,
          contentTitle: input.title,
          error: 'No valid inspirations found — check the inspiration IDs',
        });
      }

      // Create draft record
      const id = `cnt_${nanoid(12)}`;
      const now = new Date().toISOString();
      const content: Content = {
        id,
        type: input.type,
        title: input.title,
        body: '',
        inspirationIds: input.inspirationIds,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };

      await storage.set(KEYS.content(id), content);
      await addToIndex(storage, KEYS.contentIndex, id);

      // Return gathered materials for the LLM to generate content
      return JSON.stringify({
        contentType: input.type,
        contentTitle: input.title,
        contentId: id,
        voice: voice || '[No voice profile found — create src/data/voice.md]',
        materials: materials.map((m) => ({
          title: m.title,
          description: m.description,
          url: m.url,
          content: m.content.slice(0, 5000),
        })),
        instructions: input.instructions || null,
        guidelines:
          input.type === 'article'
            ? '800-1500 words, structured with headers, match the voice profile'
            : input.type === 'linkedin'
              ? '150-300 words, hook opening, professional tone, call-to-action'
              : 'Under 280 characters, punchy and shareable',
      });
    },
    {
      name: 'createContent',
      description:
        'Gather source materials and create a new content draft (article, LinkedIn post, or X post). Returns gathered materials — use them to generate the content, then call updateContent to save the draft body.',
      schema: z.object({
        type: z
          .enum(['article', 'linkedin', 'x_post'])
          .describe('Type of content to create'),
        title: z.string().describe('Working title for the content'),
        inspirationIds: z
          .array(z.string())
          .describe('IDs of inspirations to base content on'),
        instructions: z
          .string()
          .optional()
          .describe('Additional instructions for content generation'),
      }),
    },
  );
}
