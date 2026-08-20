# 01 — Code Block Formatting & Task Badge Vertical Spacing Overhaul

**What to build:** Multi-line code blocks in the Lexical editor render as true block-level containers (`display: block`, `white-space: pre-wrap`, `margin: 14px 0`) with a language tag, one-click copy button, and theme-adaptive background. Task status badges (`IN PROGRESS`, `BLOCKED`, `DONE`, `OPEN`) and tags use `display: inline-flex`, clean padding, and `line-height: 1.8` with `margin-bottom: 6px` to eliminate all vertical clipping, clumping, and line overlapping.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Code blocks render as isolated block elements (`display: block`) with distinct theme background and border radius.
- [x] Code blocks do not overlap, clip, or collide with adjacent text lines or paragraphs above/below them.
- [x] Code blocks feature a language indicator badge and a tactile one-click "Copy" button.
- [x] Task status badges (`IN PROGRESS`, `BLOCKED`, `DONE`, `OPEN`) and hashtag pills use `display: inline-flex` with vertical margin and padding ensuring no vertical overlapping across consecutive task lines.
- [x] Code blocks and task badges render correctly in both Working Mode and Arcade Mode across all themes.
- [x] Unit and component tests verify code block formatting and copy-to-clipboard behavior.
