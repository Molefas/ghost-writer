import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function updateContent(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    contentId: z.ZodString;
    body: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    body: string;
    contentId: string;
    title?: string | undefined;
}, {
    body: string;
    contentId: string;
    title?: string | undefined;
}>, {
    body: string;
    contentId: string;
    title?: string | undefined;
}, {
    body: string;
    contentId: string;
    title?: string | undefined;
}, string>;
