import { tool } from '@langchain/core/tools';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export function readInterests() {
    return tool(async () => {
        const interestsPath = join(__dirname, '../../src/data/interests.md');
        try {
            const content = readFileSync(interestsPath, 'utf-8');
            return JSON.stringify({
                charCount: content.length,
                content,
            });
        }
        catch {
            return JSON.stringify({
                charCount: 0,
                content: '',
                error: 'interests.md not found — create src/data/interests.md with your topic interests',
            });
        }
    }, {
        name: 'readInterests',
        description: "Load the user's topic interests from the interests.md file",
        schema: {},
    });
}
