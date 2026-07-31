# 04 — Custom Stateful Checklist Nodes

**What to build:** Implements the custom Lexical `DecoratorNode` to intercept our custom markdown syntax (`[ ]`, `[-]`, `[x]`, `[>]`). The tasks will render inline as interactive React components. Clicking them in the editor toggles their state and updates the underlying markdown.

**Blocked by:** 03 — Lexical Editor Foundation

**Status:** completed

- [x] Lexical properly parses `[ ]`, `[-]`, `[x]`, `[>]` as a specialized node type.
- [x] Interactive UI elements render inside Lexical for these custom tasks.
- [x] Clicking toggles state and triggers a document save.
- [x] The custom syntax is correctly serialized back to Markdown upon saving.
