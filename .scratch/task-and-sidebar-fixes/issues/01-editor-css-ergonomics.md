# 01 — Editor CSS & Ergonomics Fixes

**What to build:** Fixes visual bugs in the editor so that newly created tasks align perfectly with parsed tasks, ordered list numbers are fully visible in Working Mode, specific list markers (*, +, -) render properly instead of default dots, and the native browser spellchecker is disabled (fixing the Vietnamese text issue).

**Blocked by:** None — can start immediately

**Status:** completed

- [x] Creating a new task via `Enter` or the toolbar button aligns its left edge perfectly with existing tasks.
- [x] Numbered list digits (`1.`, `2.`) are fully visible and not cut off on the left side in Working Mode.
- [x] Unordered lists created using `*`, `+`, or `-` render those specific characters as bullets rather than generic dots.
- [x] Vietnamese text (and other text) does not show red spellcheck squiggles from the browser.
