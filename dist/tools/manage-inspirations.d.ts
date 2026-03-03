import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function manageInspirations(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    action: z.ZodEnum<["delete", "deleteMany"]>;
    inspirationId: z.ZodOptional<z.ZodString>;
    inspirationIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    action: "delete" | "deleteMany";
    inspirationId?: string | undefined;
    inspirationIds?: string[] | undefined;
}, {
    action: "delete" | "deleteMany";
    inspirationId?: string | undefined;
    inspirationIds?: string[] | undefined;
}>, {
    action: "delete" | "deleteMany";
    inspirationId?: string | undefined;
    inspirationIds?: string[] | undefined;
}, {
    action: "delete" | "deleteMany";
    inspirationId?: string | undefined;
    inspirationIds?: string[] | undefined;
}, string>;
