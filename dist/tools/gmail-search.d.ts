import { z } from 'zod';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';
export declare function gmailSearch(storage: TrikStorageContext, config: TrikConfigContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    sender: z.ZodString;
    maxResults: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sender: string;
    maxResults?: number | undefined;
}, {
    sender: string;
    maxResults?: number | undefined;
}>, {
    sender: string;
    maxResults?: number | undefined;
}, {
    sender: string;
    maxResults?: number | undefined;
}, string>;
