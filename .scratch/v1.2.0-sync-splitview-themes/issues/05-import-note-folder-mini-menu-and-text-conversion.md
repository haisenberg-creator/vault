# 05 — "Import Note/Folder" Mini-Menu, Text-to-MD Conversion & Drag-and-Drop

**What to build:** The sidebar import action is labeled "Import Note/Folder". Clicking it opens a mini-menu with options to "Import Files / Zip" and "Import Folder". In the file picker, `.txt`, `.text`, `.md`, and `.zip` files are visible and selectable. Imported `.txt` files are automatically converted into `.md` notes with original content. Dragging and dropping files or folders directly into the sidebar also triggers the import flow.

**Blocked by:** None — can start immediately.

**Status:** Done

- [x] Button in sidebar is labeled "Import Note/Folder".
- [x] Clicking the button opens a clean popover offering "Import Files / Zip" and "Import Folder".
- [x] File picker displays and accepts `.md`, `.txt`, `.text`, `.zip` files.
- [x] Imported `.txt` files are written as `.md` notes into the workspace.
- [x] Drag-and-drop of files or folders into the sidebar imports items correctly.
- [x] Automated tests in `ImportFolder.test.tsx` and `fileService.test.ts` pass.
