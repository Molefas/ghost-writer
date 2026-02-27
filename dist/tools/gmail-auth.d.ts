import { z } from 'zod';
import type { TrikStorageContext, TrikConfigContext } from '@trikhub/sdk';
export declare function gmailAuth(storage: TrikStorageContext, config: TrikConfigContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    authCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    authCode?: string | undefined;
}, {
    authCode?: string | undefined;
}>, {
    authCode?: string | undefined;
}, {
    authCode?: string | undefined;
}, string>;
