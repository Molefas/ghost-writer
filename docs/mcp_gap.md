# MCP Documentation Gaps

> Discovered during ghost-writer trik development. Report to TrikHub maintainers.

## 2026-02-27

### 1. `wrapAgent` factory pattern not documented in MCP tools

**Context**: When building the agent entry point, the pattern of passing `context.storage` to tool factory functions is critical but not explained in the MCP `analyze_trik_requirements` or `scaffold_trik` tool outputs.

**Gap**: The scaffold template shows a basic agent setup but doesn't demonstrate the factory pattern for tools that need storage access. Developers must discover this by reading SDK source code.

**Suggestion**: Add a "Tools with Storage" section to the scaffold template showing:
```typescript
export function myTool(storage: TrikStorageContext) {
  return tool(async (input) => { /* uses storage */ }, { ... });
}
```

### 2. `TrikStorageContext` API not surfaced in MCP documentation

**Context**: The storage API (`get`, `set`, `delete`, `list`, `getMany`, `setMany`) is the primary way triks persist data, but MCP tools don't document it.

**Gap**: `analyze_trik_requirements` mentions `storage: true` as a capability but doesn't describe the API surface. Developers must read `@trikhub/sdk` source types.

**Suggestion**: Include storage API reference in the MCP `MANIFEST_SCHEMA_DOC` or as a separate MCP resource.

### 3. Config access pattern undocumented

**Context**: Triks access config via `context.config.get('KEY')`. For Gmail OAuth, we needed `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from config.

**Gap**: The MCP scaffold doesn't show how to declare or access config keys. The manifest `capabilities.config` array maps to `context.config` but this mapping isn't explained.

**Suggestion**: Show config usage in scaffold template when `capabilities.config` is present.

### 4. Conversational mode system prompt loading pattern

**Context**: The system prompt is loaded via `readFileSync` and passed as `messageModifier` to `createReactAgent`. The path resolution requires `__dirname` derivation from `import.meta.url`.

**Gap**: MCP scaffold generates a placeholder but doesn't show the file-based system prompt pattern that real triks use. The `messageModifier` parameter name is LangGraph-specific and not documented.

**Suggestion**: Include the `readFileSync` + `messageModifier` pattern in conversational mode scaffolds.

### 5. Transfer back tool import path

**Context**: `transferBackTool` is imported from `@trikhub/sdk` and added to the tools array.

**Gap**: The MCP scaffold template references it but the import path and usage aren't consistently documented across MCP tool responses.

### 6. OAuth flow patterns for triks

**Context**: Implementing Gmail OAuth required a multi-turn conversational pattern where the tool returns a URL, the user authorizes externally, then pastes back a code.

**Gap**: No MCP documentation covers how to implement OAuth or other multi-turn authentication flows in conversational triks. This is a common pattern for triks integrating with external services.

**Suggestion**: Add an "Authentication Patterns" section to MCP documentation or provide an OAuth scaffold variant.
