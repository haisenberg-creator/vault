# 02 — Unified Sidebar Tree & File Management UI

**What to build:** Users can explore their Vault in the left sidebar via a collapsible nested folder tree. The tree displays distinct visual icons distinguishing standard Notes from Task Dashboards, features a Pinned Dashboards quick-access strip at top, and provides context menus and drag-and-drop support for creating, renaming, deleting, and moving files.

**Blocked by:** 01 — Folder Hierarchy & File System Storage Operations

**Status:** ready-for-agent

- [ ] Sidebar renders a collapsible folder tree supporting arbitrary nesting depth.
- [ ] Notes and Dashboards (`.dashboard.md` or `type: dashboard`) display distinct visual icons in the tree.
- [ ] Top Pinned Dashboards bar displays quick-switch buttons for all dashboards in the Vault.
- [ ] Context menus and action toolbars support Create Note, Create Folder, Create Dashboard, Rename, and Delete.
- [ ] Drag-and-drop interactions enable dragging notes or folders into target folder destinations.
- [ ] Component unit/integration tests verifying sidebar interactions and tree state updates.
