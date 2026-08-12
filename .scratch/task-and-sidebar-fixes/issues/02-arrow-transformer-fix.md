# 02 — Markdown Arrow Transformer Fix

**What to build:** Implements a custom Lexical TextMatchTransformer for `=>` so it safely converts to `⇒` without dropping the `=` character when typing quickly afterward.

**Blocked by:** None — can start immediately

**Status:** completed

- [x] Typing `=>` automatically converts to the `⇒` arrow symbol.
- [x] Immediately typing numbers or text right after the conversion (e.g., typing `7` then `8`) keeps the arrow intact without deleting characters from it.
