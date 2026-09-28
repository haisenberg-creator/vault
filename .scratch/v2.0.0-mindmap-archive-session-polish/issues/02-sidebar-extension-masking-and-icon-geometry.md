# 02: Sidebar Extension Masking and Tree Icon Geometry

**What to build:** In the sidebar navigation tree, clean up note and dashboard display names by hiding redundant `.md` and `.dashboard.md` extensions, and prevent file/folder icons from squishing when filenames are long by locking icon dimensions.

**Blocked by:** None (can start immediately)

**Required skills:** `implement`, `design-taste-frontend`, `tdd`

**Status:** resolved

- [x] Note display labels in the sidebar tree strip `.md` extensions (e.g., `meeting.md` displays as `meeting`).
- [x] Dashboard display labels in the sidebar tree strip `.dashboard.md` extensions (e.g., `projects.dashboard.md` displays as `projects`).
- [x] Non-markdown files (if any) display their full filename as-is.
- [x] Filesystem operations (file creation, renaming, active path selection, wikilink resolution) continue to use and preserve the full canonical path with extension.
- [x] Tree icons (`FileText`, `Folder`, `FolderOpen`, `LayoutDashboard`) in the sidebar item row are locked with `flex-shrink: 0`, ensuring they remain strictly 16×16px.
- [x] File label text container uses `flex: 1`, `overflow: hidden`, and `text-overflow: ellipsis` so long titles truncate cleanly with an ellipsis without wrapping or squeezing the icon.
- [x] Unit and component tests in `SidebarTree.test.tsx` verify clean display labels and non-zero icon dimensions on long names.
