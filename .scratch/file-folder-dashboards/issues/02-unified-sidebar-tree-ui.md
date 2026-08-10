# 02 — Unified Sidebar Tree & File Management UI

**What to build:** Users can explore their Vault in the left sidebar via a collapsible nested folder tree. The tree displays distinct visual icons distinguishing standard Notes from Task Dashboards, features a Pinned Dashboards quick-access strip at top, and provides context menus and drag-and-drop support for creating, renaming, deleting, and moving files.

**Blocked by:** 01 — Folder Hierarchy & File System Storage Operations

**Status:** done

- [x] Sidebar renders a collapsible folder tree supporting arbitrary nesting depth.
- [x] Notes and Dashboards (`.dashboard.md` or `type: dashboard`) display distinct visual icons in the tree.
- [x] Top Pinned Dashboards bar displays quick-switch buttons for all dashboards in the Vault.
- [x] Context menus and action toolbars support Create Note, Create Folder, Create Dashboard, Rename, and Delete.
- [x] Drag-and-drop interactions enable dragging notes or folders into target folder destinations.
- [x] Component unit/integration tests verifying sidebar interactions and tree state updates.
