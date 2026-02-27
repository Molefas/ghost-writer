import { z } from 'zod';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';
export declare function scanNewsletters(storage: TrikStorageContext, config: TrikConfigContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    sourceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxEmails: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sourceIds?: string[] | undefined;
    maxEmails?: number | undefined;
}, {
    sourceIds?: string[] | undefined;
    maxEmails?: number | undefined;
}>, {
    sourceIds?: string[] | undefined;
    maxEmails?: number | undefined;
}, {
    sourceIds?: string[] | undefined;
    maxEmails?: number | undefined;
}, string>;
