# Changelog

All notable changes to this project will be documented in this file.

## [v0.3.0] - 2026-08-18

### Highlights & Features ✨

- **Editor List Ergonomics & Custom Markers**:
  - Support custom unordered list markers (`-`, `*`, `+`, `•`, `◦`, `▪`, `→`, `★`) with markdown attribute preservation.
  - Sibling task indentation preservation and smart escape on Enter key inside task items.
  - Bidirectional text transformation for arrow symbols (`=>` ↔ `⇒`).
- **Sidebar & Folder Import**:
  - WebKit folder directory import with automatic `.txt` to `.md` format conversion.
  - Drag constraints to prevent accidental dragging of completed tasks.

### Documentation & Setup 📖

- Added interactive setup wizard reference to `SETUP.md`.
- Recommended VSCode extensions configuration for Tauri, Rust, and Vitest.

---

## [v0.2.0] - 2026-08-13

### Highlights & Features ✨

- **Editor Enhancements**:
  - Priority header templates (Urgent, High, Low) & toolbar priority buttons.
  - Priority drag-and-drop task reordering in Lexical editor.
  - Improved Lexical editor task ergonomics & markdown transformers.
- **Sidebar & Workspace**:
  - Folder import and text file conversion support.
  - Cleaned toolbar status labels and default sidebar to Files tab.
  - Accurate subfolder note path resolution and task progress tracking.

### Bug Fixes 🐛

- Prevented drag-and-drop layout flickering in `SidebarTree`.
- Fixed task duplication on move by synchronizing source task removal across layout columns.

### Maintenance & Agent Tooling 🛠️

- Bumped app & package versions to `v0.2.0`.
- Configured repository agent skills (`AGENTS.md` and `docs/agents/`).

---

## [v0.1.0] - 2026-08-01

- Initial release of Vault desktop app.
