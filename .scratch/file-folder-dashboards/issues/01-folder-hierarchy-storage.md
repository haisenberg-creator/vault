# 01 — Folder Hierarchy & File System Storage Operations

**What to build:** Users can organize their Vault into multi-level nested folders, create new folders or notes in specific sub-directories, rename or delete files and folders, and move notes between folders. All storage operations function seamlessly whether running natively in Tauri or in web mock mode.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `readWorkspaceFiles` and workspace services scan and return a nested file/folder directory tree.
- [x] Implement file & folder CRUD operations (create folder, create note in folder, rename file/folder, delete file/folder, move file/folder).
- [x] Support operations across both native Tauri FS commands and fallback in-memory web mock storage.
- [x] Comprehensive unit & integration tests covering folder tree scanning and file path mutations.
