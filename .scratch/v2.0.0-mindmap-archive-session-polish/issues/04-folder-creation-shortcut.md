# 04: Folder Creation Shortcut (`Ctrl+Shift+N`)

**What to build:** Allow users to create folders quickly from the keyboard using the standard `Ctrl+Shift+N` (or `Cmd+Shift+N` on macOS) shortcut, targeting the active folder or vault root.

**Blocked by:** None (can start immediately)

**Required skills:** `implement`, `tdd`

**Status:** resolved

- [x] Window keydown listener handles `Ctrl+Shift+N` (and `Cmd+Shift+N` on macOS).
- [x] When triggered, opens `FileOperationModal` preset to mode `create-folder`.
- [x] If an active note or folder is selected, sets the target path to that item's parent directory; otherwise sets the target path to the vault root.
- [x] Typing a folder name and confirming creates the directory via `fileService` and refreshes the sidebar tree.
- [x] Existing `Ctrl+N` note creation and `Ctrl+P` quick switcher shortcuts continue to work without conflict.
- [x] Unit tests in `DualColumnLayout.test.tsx` verify that pressing `Ctrl+Shift+N` opens the create-folder modal with the correct target path.
