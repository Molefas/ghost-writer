import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function manageContent(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    action: z.ZodEnum<["list", "setStatus", "delete"]>;
    contentId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "done"]>>;
    filterType: z.ZodOptional<z.ZodEnum<["article", "linkedin", "x_post"]>>;
    filterStatus: z.ZodOptional<z.ZodEnum<["draft", "done"]>>;
}, "strip", z.ZodTypeAny, {
    action: "list" | "setStatus" | "delete";
    status?: "draft" | "done" | undefined;
    contentId?: string | undefined;
    filterType?: "article" | "linkedin" | "x_post" | undefined;
    filterStatus?: "draft" | "done" | undefined;
}, {
    action: "list" | "setStatus" | "delete";
    status?: "draft" | "done" | undefined;
    contentId?: string | undefined;
    filterType?: "article" | "linkedin" | "x_post" | undefined;
    filterStatus?: "draft" | "done" | undefined;
}>, {
    action: "list" | "setStatus" | "delete";
    status?: "draft" | "done" | undefined;
    contentId?: string | undefined;
    filterType?: "article" | "linkedin" | "x_post" | undefined;
    filterStatus?: "draft" | "done" | undefined;
}, {
    action: "list" | "setStatus" | "delete";
    status?: "draft" | "done" | undefined;
    contentId?: string | undefined;
    filterType?: "article" | "linkedin" | "x_post" | undefined;
    filterStatus?: "draft" | "done" | undefined;
}, string>;
