# 03 — Lexical Editor Foundation

**What to build:** Replaces the raw text area with the Lexical editor framework. It will parse the markdown string from disk into Lexical's internal document state, and serialize it back out to markdown when saving to disk.

**Blocked by:** 02 — Markdown File Integration (Read/Write)

**Status:** completed

- [x] Lexical editor instances mount successfully in the right pane.
- [x] Existing markdown content loads into Lexical properly.
- [x] Saving updates the text representation on disk correctly without corruption.
