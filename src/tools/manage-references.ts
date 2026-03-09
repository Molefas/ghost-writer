import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { TrikStorageContext } from '@trikhub/sdk';
import type { Reference } from '../lib/types.js';
import { KEYS, addToIndex, removeFromIndex, getAll, getById } from '../lib/storage.js';

export function manageReferences(storage: TrikStorageContext) {
  return tool(
    async (input) => {
      switch (input.action) {
        case 'add': {
          if (!input.name) {
            return JSON.stringify({ error: 'name is required for add action' });
          }
          if (!input.type) {
            return JSON.stringify({ error: 'type is required for add action' });
          }

          // Dedup by name (case-insensitive)
          const existing = await getAll<Reference>(
            storage,
            KEYS.referenceIndex,
            KEYS.reference,
          );
          const match = existing.find(
            (r) => r.name.toLowerCase() === input.name!.toLowerCase(),
          );

          if (match) {
            // Merge new topics into existing reference
            const existingLower = match.topics.map((t) => t.toLowerCase());
            const newTopics = (input.topics ?? []).filter(
              (t) => !existingLower.includes(t.toLowerCase()),
            );
            if (newTopics.length > 0) {
              match.topics.push(...newTopics);
              try {
                await storage.set(KEYS.reference(match.id), match);
              } catch (err) {
                return JSON.stringify({ error: `Failed to merge topics: ${(err as Error).message}` });
              }
              return JSON.stringify({
                action: 'merged',
                reference: match,
                newTopics,
              });
            }
            return JSON.stringify({
              action: 'exists',
              reference: match,
            });
          }

          const id = `ref_${nanoid(10)}`;
          const ref: Reference = {
            id,
            type: input.type,
            name: input.name,
            ...(input.author && { author: input.author }),
            ...(input.knownFor && { knownFor: input.knownFor }),
            topics: input.topics ?? [],
            addedAt: new Date().toISOString(),
            addedBy: input.addedBy ?? 'agent',
          };

          try {
            await storage.set(KEYS.reference(id), ref);
            await addToIndex(storage, KEYS.referenceIndex, id);
          } catch (err) {
            return JSON.stringify({ error: `Failed to add reference: ${(err as Error).message}` });
          }

          return JSON.stringify({ action: 'added', reference: ref });
        }

        case 'list': {
          const all = await getAll<Reference>(
            storage,
            KEYS.referenceIndex,
            KEYS.reference,
          );

          let results = all;
          if (input.topics && input.topics.length > 0) {
            const filterTopics = input.topics.map((t) => t.toLowerCase());
            results = all.filter((r) =>
              r.topics.some((t) => filterTopics.includes(t.toLowerCase())),
            );
          }

          return JSON.stringify({
            action: 'listed',
            count: results.length,
            references: results,
          });
        }

        case 'delete': {
          if (!input.referenceId) {
            return JSON.stringify({ error: 'referenceId is required for delete action' });
          }
          const ref = await getById<Reference>(
            storage,
            KEYS.reference,
            input.referenceId,
          );
          if (!ref) {
            return JSON.stringify({ error: 'Reference not found' });
          }
          try {
            await storage.delete(KEYS.reference(input.referenceId));
            await removeFromIndex(storage, KEYS.referenceIndex, input.referenceId);
          } catch (err) {
            return JSON.stringify({ error: `Failed to delete reference: ${(err as Error).message}` });
          }
          return JSON.stringify({ action: 'deleted', name: ref.name });
        }

        case 'search': {
          if (!input.query) {
            return JSON.stringify({ error: 'query is required for search action' });
          }
          const all = await getAll<Reference>(
            storage,
            KEYS.referenceIndex,
            KEYS.reference,
          );
          const q = input.query.toLowerCase();
          const results = all.filter(
            (r) =>
              r.name.toLowerCase().includes(q) ||
              (r.author && r.author.toLowerCase().includes(q)) ||
              (r.knownFor && r.knownFor.toLowerCase().includes(q)) ||
              r.topics.some((t) => t.toLowerCase().includes(q)),
          );
          return JSON.stringify({
            action: 'searched',
            query: input.query,
            count: results.length,
            references: results,
          });
        }

        default:
          return JSON.stringify({ error: `Unknown action: ${input.action}` });
      }
    },
    {
      name: 'manageReferences',
      description:
        "Manage the user's reference library of books and thought leaders. Use 'add' to add a new reference (deduplicates by name, merges topics if exists), 'list' to view all (optionally filtered by topics), 'delete' to remove one, 'search' to find by name/author/topic.",
      schema: z.object({
        action: z
          .enum(['add', 'list', 'delete', 'search'])
          .describe("'add' to create, 'list' to view, 'delete' to remove, 'search' to find"),
        type: z
          .enum(['book', 'person'])
          .optional()
          .describe("Reference type (required for 'add')"),
        name: z.string().optional().describe("Book title or person's name (required for 'add')"),
        author: z.string().optional().describe('Book author (for books only)'),
        knownFor: z
          .string()
          .optional()
          .describe('What the person is known for (for people only)'),
        topics: z
          .array(z.string())
          .optional()
          .describe("Related topics (for 'add' and 'list' filter)"),
        addedBy: z
          .enum(['user', 'agent'])
          .optional()
          .describe("Who is adding this reference (default: 'agent')"),
        referenceId: z
          .string()
          .optional()
          .describe("Reference ID (required for 'delete')"),
        query: z
          .string()
          .optional()
          .describe("Search query (required for 'search')"),
      }),
    },
  );
}
