import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function scanBlog(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    sourceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sourceId: string;
}, {
    sourceId: string;
}>, {
    sourceId: string;
}, {
    sourceId: string;
}, string>;
