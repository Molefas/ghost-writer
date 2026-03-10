import { z } from 'zod';
import type { TrikStorageContext } from '@trikhub/sdk';
export declare function manageReferences(storage: TrikStorageContext): import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    action: z.ZodEnum<["add", "list", "delete", "search"]>;
    type: z.ZodOptional<z.ZodEnum<["book", "person"]>>;
    name: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    knownFor: z.ZodOptional<z.ZodString>;
    topics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    addedBy: z.ZodOptional<z.ZodEnum<["user", "agent"]>>;
    referenceId: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "add" | "list" | "delete" | "search";
    type?: "book" | "person" | undefined;
    name?: string | undefined;
    query?: string | undefined;
    author?: string | undefined;
    knownFor?: string | undefined;
    topics?: string[] | undefined;
    addedBy?: "user" | "agent" | undefined;
    referenceId?: string | undefined;
}, {
    action: "add" | "list" | "delete" | "search";
    type?: "book" | "person" | undefined;
    name?: string | undefined;
    query?: string | undefined;
    author?: string | undefined;
    knownFor?: string | undefined;
    topics?: string[] | undefined;
    addedBy?: "user" | "agent" | undefined;
    referenceId?: string | undefined;
}>, {
    action: "add" | "list" | "delete" | "search";
    type?: "book" | "person" | undefined;
    name?: string | undefined;
    query?: string | undefined;
    author?: string | undefined;
    knownFor?: string | undefined;
    topics?: string[] | undefined;
    addedBy?: "user" | "agent" | undefined;
    referenceId?: string | undefined;
}, {
    action: "add" | "list" | "delete" | "search";
    type?: "book" | "person" | undefined;
    name?: string | undefined;
    query?: string | undefined;
    author?: string | undefined;
    knownFor?: string | undefined;
    topics?: string[] | undefined;
    addedBy?: "user" | "agent" | undefined;
    referenceId?: string | undefined;
}, string>;
