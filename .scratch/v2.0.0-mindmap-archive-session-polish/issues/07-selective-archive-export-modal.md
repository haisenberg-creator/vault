# 07: Selective Archive Export Modal with Hierarchical Tree

**What to build:** Replace the blind full-vault export action with an interactive Export Archive modal where users can select individual folders and notes via a hierarchical checklist, toggle all items with a "Select All" button, and export a zip containing only the chosen files.

**Blocked by:** None (can start immediately)

**Required skills:** `implement`, `design-taste-frontend`, `tdd`

**Status:** resolved

- [x] Create an interactive `ExportArchiveModal` component triggered from the sidebar's "Sync / Export Vault Archive" button.
- [x] Render the V-Folder hierarchy as a tree with checkboxes for every folder, note (`.md`), and dashboard (`.dashboard.md`).
- [x] Checking a folder selects all descendant notes and subfolders.
- [x] Partially selected folder branches display a visual indeterminate checkbox state (`-`).
- [x] Header toolbar includes a master "Select All / Deselect All" toggle button and an item counter ("X notes, Y folders selected").
- [x] "Export (.zip)" primary action packages only the checked files into a `.zip` archive via `fileService`, strictly preserving relative folder paths from the V-Folder root.
- [x] Unit and component tests in `TaskDashboardSidebar.test.tsx` and `fileService.test.ts` verify tree selection, tri-state toggling, and selective zip generation.
