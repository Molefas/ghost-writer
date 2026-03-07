import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function manageVoice(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    action: z.ZodEnum<["read", "update"]>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "update" | "read";
    content?: string | undefined;
}, {
    action: "update" | "read";
    content?: string | undefined;
}>, {
    action: "update" | "read";
    content?: string | undefined;
}, {
    action: "update" | "read";
    content?: string | undefined;
}, string>;
