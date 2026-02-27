import { tool } from '@langchain/core/tools';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function readVoice() {
  return tool(
    async () => {
      const voicePath = join(__dirname, '../../src/data/voice.md');
      try {
        const content = readFileSync(voicePath, 'utf-8');
        return JSON.stringify({
          charCount: content.length,
          content,
        });
      } catch {
        return JSON.stringify({
          charCount: 0,
          content: '',
          error: 'voice.md not found — create src/data/voice.md with your writing style description',
        });
      }
    },
    {
      name: 'readVoice',
      description: "Load the user's writing voice profile from the voice.md file",
      schema: {},
    },
  );
}
