# Live Background Scope, System Tray, Split View Polish, and Editor Spacing

## Context and Problem Statement

As Vault evolves with customizable themes, live backgrounds, split-view editing, and global hotkeys, several UX and architectural needs emerged:

1. Users want the option to restrict the Live Background to the Sidebar or let it span the entire app with frosted glass panels.
2. Global Shortcuts (`Ctrl+Alt+N` and `Ctrl+Alt+P`) need to work reliably even when the window is closed or hidden from the taskbar, requiring a background System Tray presence.
3. Code blocks and task status badges within the Lexical editor suffered from line-clamping and vertical overlap due to inline rendering and tight vertical margins.
4. Split View dual panes lacked visual polish at the divider boundary and had an unrefined active pane outline.
5. AI agents working on Vault require codebase graph intelligence via Graphify prior to the v2.0.0 in-app Graph View.

## Considered Options

### 1. Live Background Scope

- **Full App Only**: Live background is always global, forcing translucent backgrounds across all panes.
- **Sidebar Only**: Live background is strictly pinned to the sidebar.
- **Configurable Scope (Chosen)**: Add a `Live Background Scope` setting (`Full App` vs `Sidebar Only`) allowing users to choose whether the background covers the whole app or solely the navigation drawer.

### 2. Background Execution & System Tray

- **Taskbar Minimization Only**: App only lives in the taskbar. Closing the window quits the application.
- **Tauri System Tray Integration (Chosen)**: Add a system tray icon in Tauri. When minimized or closed with tray active, Vault stays resident in the background notification area without cluttering the taskbar, and Global Shortcuts (`Ctrl+Alt+N`, `Ctrl+Alt+P`) or clicking the tray icon instantly restore and focus the window.

### 3. Editor Block Rhythm & Code Block Overhaul

- **CSS-Only Inline Patch**: Keeping inline `<code>` tags with margin adjustments.
- **Block Layout & Typography Rhythm (Chosen)**: Style `.lexical-code-block` as `display: block; width: 100%; white-space: pre-wrap; margin: 12px 0;` with language badge, copy action, and give task status badges `display: inline-flex` with proper vertical padding and margins to eliminate vertical clipping.

### 4. Split View Divider & Focus Affordance

- **Plain 6px Divider**: Raw vertical strip with 1px border outline around active pane.
- **Grip-Handle Divider with Top Focus Strip (Chosen)**: Refined divider featuring a centered grip handle (`⋮⋮`), smooth hover/drag transitions, and replacing the harsh 1px pane outline with a subtle top accent bar and soft ambient glow.

### 5. Graphify Integration

- **Graphify AI Agent Skill (Chosen)**: Integrate Graphify as an AI agent skill in `.agents/skills/graphify/` and provide repository indexing scripts in `scripts/`, while queuing the in-app interactive Graph View for v2.0.0.

## Consequences

- **Settings Modal**: Exposes Live Background Scope (`Full App` | `Sidebar Only`), opacity, and blur settings.
- **System Tray**: Keeps Vault accessible via global OS hotkeys at all times.
- **Editor Polish**: Eliminates all visual clipping and overlapping in both Working Mode and Arcade Mode.
- **Split View**: Provides clear visual affordance and smooth resizing for dual-pane note workflows.
