import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function searchInspirations(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minScore: z.ZodOptional<z.ZodNumber>;
    sourceId: z.ZodOptional<z.ZodString>;
    since: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sourceId?: string | undefined;
    query?: string | undefined;
    tags?: string[] | undefined;
    minScore?: number | undefined;
    since?: string | undefined;
    limit?: number | undefined;
}, {
    sourceId?: string | undefined;
    query?: string | undefined;
    tags?: string[] | undefined;
    minScore?: number | undefined;
    since?: string | undefined;
    limit?: number | undefined;
}>, {
    sourceId?: string | undefined;
    query?: string | undefined;
    tags?: string[] | undefined;
    minScore?: number | undefined;
    since?: string | undefined;
    limit?: number | undefined;
}, {
    sourceId?: string | undefined;
    query?: string | undefined;
    tags?: string[] | undefined;
    minScore?: number | undefined;
    since?: string | undefined;
    limit?: number | undefined;
}, string>;
