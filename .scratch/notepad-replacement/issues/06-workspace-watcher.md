# 06 — Workspace-Wide File Watcher

**What to build:** Expands the Tauri filesystem logic to scan and watch a target workspace folder for _all_ `.md` files. The left column dashboard will now aggregate tasks from across the entire workspace, rather than just the active note.

**Blocked by:** 05 — Single-Document Task Dashboard

**Status:** completed

- [x] Tauri fs/watcher logic can read a whole directory of `.md` files.
- [x] The Global Task Dashboard aggregates tasks from multiple distinct notes.
- [x] Updates to a note file (or its tasks) trigger a UI update to the global dashboard.
