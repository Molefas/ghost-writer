import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function getInspirationContent(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    inspirationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    inspirationId: string;
}, {
    inspirationId: string;
}>, {
    inspirationId: string;
}, {
    inspirationId: string;
}, string>;
