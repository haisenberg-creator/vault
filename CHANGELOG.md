# Changelog

All notable changes to this project will be documented in this file.

## [v1.3.0] - 2026-08-20

### Highlights & Features ✨

- **Live Background Scope & Frosted Sidebar Polish (Ticket 03 & ADR 0012)**:
  - Added Live Background Scope toggle in Settings Modal: **"Full App"** (global backdrop with translucent frosted glass across all panes) vs **"Sidebar Only"** (live background confined to sidebar navigation drawer, keeping the editor solid).
  - Modern frosted glassmorphism (`backdrop-filter: blur(16px)`) in the sidebar drawer, ambient active note glow (`box-shadow: 0 0 12px var(--rose-pink-glow)`), and smooth micro-transitions.
- **System Tray Integration & Resilient Global OS Shortcuts (Ticket 04 & ADR 0012)**:
  - Tauri System Tray with left-click toggle and context menu shortcuts for _Open Vault_, _Quick Switcher_, _New Note_, and _Quit_.
  - Close-to-Tray background residence (`WindowEvent::CloseRequested` hides window instead of exiting).
  - Enhanced global shortcuts (`Ctrl+Alt+N`, `Ctrl+Alt+P`) with `KeyN`/`KeyP` cross-platform token normalization and atomic window restoration (`unminimize()` + `show()` + `setFocus()`).
- **Code Block Overlay Actions & Task Badge Alignment (Ticket 01)**:
  - Floating code block overlay header rendered outside Lexical's contentEditable container to prevent DOM reconciliation conflicts.
  - Tactile "Copy" button with clipboard fallback and uppercase language badge (`JS`, `TS`, `HTML`, etc.).
  - Isolated block formatting and task paragraph vertical line-height spacing (`1.8`) with `inline-flex` alignment.
- **Split View Divider Redesign & Ambient Focus (Ticket 02)**:
  - Centered tactile drag grip (`⋮⋮`), subtle border highlights, rose hover glow, and boundary ratio clamping (20%–80%).
  - Sleek top accent bar (`border-top: 2px solid var(--rose-pink)`) and ambient glow for active pane focus.
- **Graphify AI Agent Skill & AST Knowledge Graph (Ticket 05)**:
  - Repository AST knowledge graph generator (`scripts/graphify.js` and `npm run graphify`) mapping modules, imports, exports, and Tauri IPC commands ahead of the v2.0.0 Graph View.

---

## [v1.2.0] - 2026-08-20

### Highlights & Features ✨

- **Split View Dual-Pane Editing (Ticket 07 & ADR 0011)**:
  - Side-by-side editable panes with independent active notes, Lexical editor states, and scroll positions.
  - Instant pane splitting via `Ctrl+\` / `Cmd+\`, the Note Action Bar button, or sidebar file context menu.
  - Draggable vertical splitter for smooth pane resizing, active pane focus routing for Quick Switcher/sidebar navigation, and single-click pane close.
- **Device-to-Device Sync via Vault Archive (Ticket 06 & ADR 0010)**:
  - Export entire active V-Folder into a self-contained `.zip` Vault Archive for reliable, offline-first backup and transfer across devices.
  - Seamless archive import with automatic zip extraction, folder hierarchy preservation, and Replace vs. Merge conflict resolution.
- **Unified "Import Note/Folder" & Auto Text-to-MD Conversion (Ticket 05)**:
  - Intuitive mini-menu popover in sidebar offering "Import Files / Zip" and "Import Folder".
  - File picker support for `.txt`, `.text`, `.md`, and `.zip` archives with automatic conversion of plain text into `.md` notes.
  - Full drag-and-drop support directly onto the sidebar tree.
- **Expanded Themes & Frosted Glassmorphism for Live Backgrounds (Ticket 04)**:
  - Added 4 curated modern color palettes: **Catppuccin Mocha**, **Dracula Pro**, **Gruvbox Dark**, and **Catppuccin Latte** (7 themes total).
  - Translucent frosted glass paneling with `backdrop-filter: blur(16px)` when Live Backgrounds are active, preserving WCAG AA text contrast.
- **Unified Single-Row Note Action Bar (Ticket 02)**:
  - Consolidated editor action bar featuring clean uppercase `PRIORITY:` header buttons (`[Urgent]`, `[High]`, `[Low]`), `STATUS:` badges, list marker picker, and inline rich text formatting (`B`, `I`, `S`, `==HL==`).

### Bug Fixes & Improvements 🐛

- **Task Drag Restrictions for Completed Tasks (Ticket 03)**:
  - Completed (`- [x]`) tasks can now be reordered freely within their parent note, but are prevented from being accidentally dragged across notes or dropped onto sidebar tree nodes.
- **Multi-Line Code Block Rendering (Ticket 01)**:
  - Isolated block layout, pre-wrap whitespace, consistent line spacing, and horizontal scrolling for `.lexical-code-block` across all themes and modes.
- **System-Wide Global OS Shortcuts (Ticket 01)**:
  - Normalized shortcut handling for `Ctrl+Alt+N` (New Note) and `Ctrl+Alt+P` (Quick Switcher) to reliably bring Vault to the foreground and trigger actions even when minimized or running in the background.

---

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
