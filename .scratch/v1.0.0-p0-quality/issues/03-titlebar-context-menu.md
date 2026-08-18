# 03 — TitleBar right-click context menu on Note icon

**What to build:** Right-clicking the Note icon (the book/lectern SVG) in the TitleBar opens a small context menu with three actions:

- **Copy Path** — writes the full absolute path of the open Note to the clipboard
- **Copy Relative Path** — writes the workspace-relative short path (the same value shown in the badge) to the clipboard
- **Reveal in File Explorer** — opens the Note's parent directory in the OS file manager using the already-installed Tauri opener plugin

The menu closes when the user clicks outside it or presses Escape.

**Blocked by:** 02 — Breadcrumb bar cleanup (TitleBar is already reworked; Note icon and path values are accessible)

**Status:** closed

- [x] Right-clicking the Note icon in TitleBar opens a context menu with all three options
- [x] `Copy Path` writes the full absolute path to the clipboard
- [x] `Copy Relative Path` writes the last-two-segment path to the clipboard
- [x] `Reveal in File Explorer` opens the Note's parent folder in the OS file manager (uses `@tauri-apps/plugin-opener`)
- [x] The menu closes on any outside click
- [x] The menu closes when Escape is pressed
- [x] The menu does not open if no Note is currently active (no file open)
- [x] Test: simulate `contextmenu` on the Note icon; assert all three menu items are visible
- [x] Test: simulate Escape keydown while menu is open; assert menu is no longer rendered
