# 02 — Markdown File Integration (Read/Write)

**What to build:** Integrates Tauri filesystem APIs to read a `.md` file from disk into the right pane as raw text, and writes any changes back to disk. This establishes our primary data storage seam.

**Blocked by:** 01 — Core Layout & Theming Scaffold

**Status:** completed

- [x] Tauri command reads text content from a local markdown file and displays it.
- [x] Edits to the text in the UI trigger a save back to the local file.
- [x] Verify that changes persist by checking the file on disk.
