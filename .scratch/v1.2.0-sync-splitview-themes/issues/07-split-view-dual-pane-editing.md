# 07 — Split View Dual-Pane Layout & Independent Note Editing

**What to build:** Side-by-side dual-pane editing in Vault. Users can toggle Split View via `Ctrl+\`, a "Split Right" button in the Action Bar, or right-clicking a file in the sidebar tree. Left and Right panes maintain independent active notes, Lexical editor states, and scroll positions. Clicking notes in the sidebar or Quick Switcher opens in the focused active pane. A draggable vertical divider adjusts pane widths, and a close button collapses the layout back to single-pane view.

**Blocked by:** 02 — Unified Note Action Bar & Priority Header Formatting

**Status:** Done

- [x] Split View can be toggled via `Ctrl+\` / `Cmd+\`, the Note Action Bar button, or sidebar file context menu.
- [x] Left and Right panes render independent `EditorPane` or `DashboardView` instances.
- [x] Active pane focus is visually indicated; file selections from sidebar or Quick Switcher route to the focused pane.
- [x] A draggable divider allows resizing pane widths smoothly.
- [x] Closing a split pane cleanly returns to single-pane view without losing unsaved changes.
- [x] Automated tests in `DualColumnLayout.test.tsx` pass.
