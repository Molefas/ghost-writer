import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function createContent(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    type: z.ZodEnum<["article", "linkedin", "x_post"]>;
    title: z.ZodString;
    inspirationIds: z.ZodArray<z.ZodString, "many">;
    instructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "article" | "linkedin" | "x_post";
    title: string;
    inspirationIds: string[];
    instructions?: string | undefined;
}, {
    type: "article" | "linkedin" | "x_post";
    title: string;
    inspirationIds: string[];
    instructions?: string | undefined;
}>, {
    type: "article" | "linkedin" | "x_post";
    title: string;
    inspirationIds: string[];
    instructions?: string | undefined;
}, {
    type: "article" | "linkedin" | "x_post";
    title: string;
    inspirationIds: string[];
    instructions?: string | undefined;
}, string>;
