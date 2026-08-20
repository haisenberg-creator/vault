# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.1] - 2026-08-20

### Bug Fixes & Improvements 🐛

- **Auto-Updater Plugin Initialization & Permissions**:
  - Registered `tauri_plugin_updater` plugin in Tauri builder in `src-tauri/src/lib.rs`.
  - Added `"updater:default"` capability permission in `src-tauri/capabilities/default.json` to enable in-app updater IPC check and install operations.
  - Added comprehensive automated unit test suite for `UpdateNotification` component.

---

## [v1.1.0] - 2026-08-20

### Highlights & Features ✨

- **Settings Modal & Dynamic Live Backgrounds (Ticket 08)**:
  - Added dedicated Settings modal with theme selection (Rosé Pine, Arcade, Charcoal, OLED), font family customization, UI scaling, and auto-save controls.
  - Interactive live animated canvas backgrounds: Matrix rain, Starfield, Aurora borealis, and Geometric mesh.
- **Universal Note & Document Importer (Ticket 07)**:
  - Universal importer supporting batch import of Markdown (`.md`), plain text (`.txt`), and Microsoft Word (`.docx`) documents with automatic conversion via Mammoth.
- **Sidebar & Icon Polish (Ticket 06)**:
  - Upgraded sidebar visuals with Lucide icons, improved tab layout, and refined navigation.
- **Global & Local Keyboard Shortcuts + Quick Switcher (Tickets 04 & OS shortcuts)**:
  - Fuzzy Quick Switcher modal (`Ctrl+P` / `Cmd+P`) for instantaneous note search and switching.
  - Native OS-level global shortcuts via Tauri global shortcut plugin (`Alt+Shift+V` / `Alt+Shift+N`).
  - Contextual in-app shortcuts for note creation (`Ctrl+N` / `Cmd+N`) and tab navigation (`Ctrl+1..3`).
- **Interactive Tagging System & Dashboard Filtering (Ticket 03)**:
  - Automatic `#tag` extraction from notes and task lines with interactive tag filtering in the Task Dashboard.
- **Rich Text Formatting Toolbar & Highlight Extension (Ticket 02)**:
  - Floating and top-level Lexical editor toolbar supporting Bold, Italic, Strikethrough, Code block, and Custom Text Highlighting.
- **TitleBar & NoteActionBar Redesign (Ticket 01)**:
  - Polished TitleBar chrome, breadcrumb truncation, and integrated NoteActionBar actions.

---

## [v1.0.0] - 2026-08-18

### Highlights & Features ✨

- **TitleBar Redesign & Breadcrumb Cleanup**:
  - Truncated displayed note paths to at most the last two path segments (e.g. `Projects/Vault.md`) for clean, instant note recognition.
  - Relocated the `WORKING / ARCADE` mode toggle into the title bar chrome with themed icon indicators.
  - Added right-click context menu on the Note lectern icon with `Copy Path`, `Copy Relative Path`, and `Reveal in File Explorer` (powered by Tauri opener plugin).
- **Accurate Note-Scoped Task Dashboard Count**:
  - Scoped the `Tasks (N)` sidebar tab badge strictly to the currently active Note's tasks.
  - Preserved multi-file task aggregation, filtering, and cross-note task moving within the dashboard.
- **Unified Theme Mode State**:
  - Lifted theme mode state management to the shared layout parent to seamlessly synchronize window chrome and sidebar.

### Bug Fixes 🐛

- **Fixed Phantom Task Copy on DnD**: Prevented duplicate task creation when dragging a task near its original location in the Lexical editor.
- **Fixed Stray Dot Marker on Task Deletion**: Cleaned up leftover `•` bullet markers when deleting tasks created via the status toolbar buttons.

---

## [v0.4.0] - 2026-08-18

### Highlights & Features ✨

- **Automatic Updates via GitHub Releases**:
  - Added background update checking on application startup using Tauri's updater plugin.
  - Implemented custom in-app `UpdateNotification` UI styled seamlessly with Vault's Rosé Pine / Arcade aesthetic.
  - One-click "Install Now" downloading, background verification, and seamless restart.
- **Release & Signing Pipeline**:
  - Configured cryptographic ED25519 binary signing in GitHub Actions workflow (`release.yml`).
  - Automated `latest.json` release manifest generation for seamless desktop updates.

---

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
