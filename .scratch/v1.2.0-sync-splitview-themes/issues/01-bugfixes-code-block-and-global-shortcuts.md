# 01 — Bugfixes: Code Block Formatting & System-Wide Global OS Shortcuts

**What to build:** Multi-line code blocks in the note editor must render with isolated block layout, clean line spacing, distinct background, and horizontal scrolling for long code without overlapping or clogging lines. System-wide global OS shortcuts (`Ctrl+Alt+N` / `Cmd+Opt+N` to create a new note, and `Ctrl+Alt+P` / `Cmd+Opt+P` to open the Quick Switcher) must trigger reliably when Vault is in the background or minimized, unminimizing and focusing the app window.

**Blocked by:** None — can start immediately.

**Status:** Done

- [x] Multi-line code blocks inside `.lexical-code-block` display with proper block isolation, pre-wrap whitespace, consistent line-height, and no overlapping text.
- [x] Code blocks render correctly across all themes, including Working and Arcade modes.
- [x] Global shortcut service properly normalizes shortcut events from the OS plugin across platforms.
- [x] Pressing `Ctrl+Alt+N` when Vault is in the background brings the window to the foreground and creates a new note.
- [x] Pressing `Ctrl+Alt+P` when Vault is in the background brings the window to the foreground and opens the Quick Switcher.
- [x] Automated tests in `globalShortcutService.test.ts` and `EditorPane.test.tsx` pass.
