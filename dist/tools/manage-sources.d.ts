import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function manageSources(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    action: z.ZodEnum<["add", "remove", "list", "update"]>;
    sourceType: z.ZodOptional<z.ZodEnum<["blog", "article", "newsletter"]>>;
    name: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    sourceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "add" | "remove" | "list" | "update";
    sourceType?: "blog" | "article" | "newsletter" | undefined;
    name?: string | undefined;
    url?: string | undefined;
    email?: string | undefined;
    sourceId?: string | undefined;
}, {
    action: "add" | "remove" | "list" | "update";
    sourceType?: "blog" | "article" | "newsletter" | undefined;
    name?: string | undefined;
    url?: string | undefined;
    email?: string | undefined;
    sourceId?: string | undefined;
}>, {
    action: "add" | "remove" | "list" | "update";
    sourceType?: "blog" | "article" | "newsletter" | undefined;
    name?: string | undefined;
    url?: string | undefined;
    email?: string | undefined;
    sourceId?: string | undefined;
}, {
    action: "add" | "remove" | "list" | "update";
    sourceType?: "blog" | "article" | "newsletter" | undefined;
    name?: string | undefined;
    url?: string | undefined;
    email?: string | undefined;
    sourceId?: string | undefined;
}, string>;
