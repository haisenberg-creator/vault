# 03 — TitleBar right-click context menu on Note icon

**What to build:** Right-clicking the Note icon (the book/lectern SVG) in the TitleBar opens a small context menu with three actions:

- **Copy Path** — writes the full absolute path of the open Note to the clipboard
- **Copy Relative Path** — writes the workspace-relative short path (the same value shown in the badge) to the clipboard
- **Reveal in File Explorer** — opens the Note's parent directory in the OS file manager using the already-installed Tauri opener plugin

The menu closes when the user clicks outside it or presses Escape.

**Blocked by:** 02 — Breadcrumb bar cleanup (TitleBar is already reworked; Note icon and path values are accessible)

**Status:** ready-for-agent

- [ ] Right-clicking the Note icon in TitleBar opens a context menu with all three options
- [ ] `Copy Path` writes the full absolute path to the clipboard
- [ ] `Copy Relative Path` writes the last-two-segment path to the clipboard
- [ ] `Reveal in File Explorer` opens the Note's parent folder in the OS file manager (uses `@tauri-apps/plugin-opener`)
- [ ] The menu closes on any outside click
- [ ] The menu closes when Escape is pressed
- [ ] The menu does not open if no Note is currently active (no file open)
- [ ] Test: simulate `contextmenu` on the Note icon; assert all three menu items are visible
- [ ] Test: simulate Escape keydown while menu is open; assert menu is no longer rendered
