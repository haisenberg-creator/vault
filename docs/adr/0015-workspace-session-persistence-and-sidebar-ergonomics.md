# Workspace Session Persistence and Sidebar Ergonomics

## Context and Problem Statement

Prior to v2.0.0, restarting Vault reset the user's active context: open notes, split-view panes, divider ratios, sidebar expansion trees, and active task/tag filters were lost. Additionally, the sidebar navigation drawer had a static 300px width with no resize or collapse capabilities, restricting flexibility on narrow laptops or during multi-pane editing.

## Considered Options

### 1. Session Storage Strategy

- **Option A: Hidden State File in V-Folder (`.vault/session.json`)** — Save layout state directly into the vault root. Rejected because it violates the principle that the user's V-Folder must remain 100% human-readable plain text without proprietary editor configuration files.
- **Option B: Browser Local Storage (`localStorage`) (Chosen)** — Cache transient layout state (`vault_session_v2`) in local browser storage with debounced writes (150ms). On boot, validate recorded paths against the current file tree; if a file was deleted externally while Vault was closed, prune it and fall back gracefully to the first available note.

### 2. Sidebar Collapse & Resizing Ergonomics

- **Option A: Fixed 40px Mini-Icon Rail** — Collapsing leaves an icon bar. Rejected because full Zen mode requires an unobstructed 0px collapse for distraction-free writing.
- **Option B: Full 0px Zen Collapse with Draggable Divider (Chosen)** — The sidebar can be collapsed to 0px via `Ctrl+B` / `Cmd+B` or a TitleBar toggle icon. A vertical divider handle allows smooth dragging between 200px and 480px, with auto-collapse triggering if dragged below 160px. Internal sidebar elements (stats, filters) reflow fluidly without clipping.

## Consequences

- **Continuity**: Users resume work exactly where they left off across reboots.
- **Resilience**: Deleting notes outside Vault does not cause crashes or broken UI states on restart.
- **Canvas Freedom**: Dual-column editing benefits from flexible sidebar sizing and 0px Zen collapse.
