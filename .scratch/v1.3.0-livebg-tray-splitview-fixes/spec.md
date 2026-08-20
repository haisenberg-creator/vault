Status: ready-for-agent
Labels: ready-for-agent

# Specification: Live Background Scope, System Tray, Split View Polish, Code Block Rhythm & Graphify (v1.3.0)

## Problem Statement

Users of Vault have identified several key visual and functional friction points that degrade their daily productivity and aesthetic experience:

1. **Live Background Scope Inflexibility**: The Live Background currently applies globally across the entire app window. Users who prefer a distraction-free solid editing canvas while still enjoying an ambient, animated background in their navigation drawer have no way to constrain the Live Background to the Sidebar.
2. **Dull Sidebar Appearance**: The navigation Sidebar looks flat and uninspired, lacking the modern tactile depth, glassmorphic frosted translucency, glowing active file indicators, and micro-animations present in contemporary desktop productivity apps.
3. **Overlapping & Clogged Code Blocks and Task Badges**: In the editor, multi-line code blocks and task item pills (`(i) IN PROGRESS`, `[ ] OPEN`) collapse vertically and overlap adjacent text lines due to inline rendering and insufficient vertical margins.
4. **Global Shortcuts Failing in Background**: OS-level Global Shortcuts (`Ctrl+Alt+N` for New Note and `Ctrl+Alt+P` for Quick Switcher) do not reliably restore and focus Vault when the window is closed or hidden from the taskbar, because the application lacks a background resident System Tray.
5. **Unrefined Split View Divider & Harsh Active Outline**: The Split View separator between dual editing panes is a plain flat bar without grip affordance, and the active pane is highlighted with a rigid 1px full-box outline that creates a cluttered visual border.
6. **Lack of Codebase Graph Intelligence for AI Agents**: AI assistants working on the Vault codebase lack AST knowledge graph capabilities to inspect architecture and dependencies ahead of the upcoming v2.0.0 in-app Graph View.

## Solution

Vault delivers a comprehensive visual upgrade and system enhancement suite:

1. **Configurable Live Background Scope**: A dedicated setting in the Settings Modal offering two modes:
   - **Full App**: Live background spans the entire window behind frosted glass panels.
   - **Sidebar Only**: Live background is rendered exclusively inside the Sidebar navigation drawer, keeping the Editor pane solid and high-contrast.
2. **Tactile & Glassmorphic Sidebar Polish**: Modern glassmorphism with dynamic backdrop blur, subtle gradient accent borders on hover and active states, ambient glow on the active note, refined status badges, and smooth accordion transitions.
3. **Editor Rhythm & Code Block Formatting Overhaul**:
   - Code blocks rendered as true block-level containers (`display: block`, `white-space: pre-wrap`, `margin: 12px 0`) with language badges, a one-click "Copy" action, and theme-adaptive styling.
   - Task status badges and tags styled with `display: inline-flex`, clean vertical padding, and `line-height: 1.8` to eliminate all vertical clipping and clumping.
4. **System Tray & Resilient Global Shortcuts**:
   - Tauri System Tray integration keeping Vault resident in the OS notification area when minimized or closed with "Close to Tray".
   - Robust shortcut event normalization and window restoration (`unminimize()` + `show()` + `setFocus()`) ensuring `Ctrl+Alt+N` and `Ctrl+Alt+P` trigger instantly from anywhere in the OS.
5. **Sleek Split View Divider & Ambient Pane Focus**:
   - A redesigned Split View Divider featuring a centered tactile grip pill (`⋮⋮`), subtle border lines, smooth drag cursor, and accent glow on hover.
   - Active pane focus indicated by a sleek top accent strip and soft border glow instead of a harsh full outline.
6. **Graphify Skill & Indexing Pipeline**:
   - A standardized Graphify AI agent skill in `.agents/skills/graphify/` and repository indexing scripts in `scripts/` to provide deep codebase AST knowledge graph intelligence for AI agents.

## User Stories

1. As a user, I want to choose between "Full App" and "Sidebar Only" for the Live Background scope in Settings, so that I can have an animated sidebar while keeping my main note editor solid.
2. As a user, I want my Live Background opacity and blur settings to apply smoothly regardless of the selected scope, so that I can fine-tune text readability.
3. As a user, I want the Sidebar to feature modern frosted glassmorphism and subtle glowing indicators for active notes, so that my workspace feels premium and alive.
4. As a user, I want folder and file items in the Sidebar to have smooth hover transitions and refined icons, so that browsing my V-Folder is visually satisfying.
5. As a user, I want multi-line code blocks in my notes to render as isolated blocks with clean margins, so that they never overlap or clip adjacent text.
6. As a user, I want code blocks to display a language badge and a tactile "Copy" button, so that I can easily copy code snippets without manual selection.
7. As a user, I want task status badges (`IN PROGRESS`, `BLOCKED`, `DONE`, `OPEN`) to have generous vertical spacing and inline-flex alignment, so that consecutive task lines do not crowd each other.
8. As a user, I want Vault to minimize or close to the System Tray, so that it stays ready in the background without cluttering my taskbar.
9. As a user, I want pressing `Ctrl+Alt+N` anywhere on my computer to unminimize Vault, focus the window, and open a new note immediately, even if Vault was hidden in the system tray.
10. As a user, I want pressing `Ctrl+Alt+P` anywhere on my computer to unminimize Vault, focus the window, and open the Quick Switcher command palette, so that I can jump to any note instantly.
11. As a user, I want clicking the System Tray icon to toggle Vault window visibility, so that I have quick mouse access to my notes.
12. As a user, I want the Split View Divider to feature a centered grip handle (`⋮⋮`) with smooth hover glow, so that resizing panes feels natural and polished.
13. As a user, I want the active pane in Split View to be highlighted with an elegant top accent bar and soft ambient glow, so that I know which pane is active without visual clutter.
14. As an AI developer/agent, I want a Graphify skill in the workspace, so that I can index and query codebase relationships and AST dependencies during development.

## Implementation Decisions

- **Live Background Scope Engine**:
  - Store `vault_live_bg_scope` (`"full"` | `"sidebar"`) in local storage / theme service.
  - When scope is `"sidebar"`, attach the live background backdrop exclusively inside the `<TaskDashboardSidebar />` container with `overflow: hidden`, while the root background remains solid `var(--rose-bg-base)`.
  - When scope is `"full"`, attach the live background backdrop to the fixed app container and apply translucent glass tokens across all panels.
  - Expose a segmented control (`Full App` / `Sidebar Only`) in `SettingsModal`.

- **Sidebar Visual & Tactile Upgrade**:
  - Apply frosted glassmorphism via `backdrop-filter: blur(16px)` and semi-transparent background overlays.
  - Add gradient border highlights and subtle glowing indicators (`box-shadow: 0 0 12px var(--rose-pink-glow)`) on the currently selected note.
  - Enhance hover transitions on file tree rows and dashboard section headers with `transition: var(--transition-fast)`.

- **Editor Rhythm & Code Block Overhaul**:
  - Style `.lexical-code-block` with `display: block; width: 100%; white-space: pre-wrap; margin: 14px 0; padding: 14px 16px; border-radius: var(--radius-md); font-family: var(--font-mono); line-height: 1.6;`.
  - Provide a floating/header utility bar on code blocks with language indicator and copy-to-clipboard button.
  - Style `.lexical-paragraph:has([data-task-state])` and status badges with `display: inline-flex; align-items: center; line-height: 1.8; margin-bottom: 6px;` to guarantee generous vertical breathing room.

- **System Tray & Background Shortcut Pipeline**:
  - Configure Tauri v2 System Tray (`tauri::tray::TrayIconBuilder`) in `src-tauri/src/lib.rs` with menu actions (Show Vault, Quick Switcher, New Note, Quit) and single-click to toggle window visibility.
  - Prevent window destruction on close event when "Close to Tray" is enabled; instead hide the window.
  - In `globalShortcutService.ts`, normalize key tokens (e.g. `CommandOrControl` vs `Control`, `KeyN` vs `N`), and implement an atomic window restoration sequence:
    1. Show window (`appWindow.show()`)
    2. Unminimize window (`appWindow.unminimize()`)
    3. Set focus (`appWindow.setFocus()`)

- **Split View Divider & Focus Affordance**:
  - Replace the raw 6px divider in `DualColumnLayout.tsx` with a styled divider component containing a centered vertical grip handle (`⋮⋮`), subtle border lines (`1px solid var(--rose-border-color)`), and smooth transition to `var(--rose-pink)` on hover and dragging.
  - Replace the full 1px box outline on the active pane with a 2px top accent strip (`border-top: 2px solid var(--rose-pink)`) and soft ambient glow (`box-shadow: inset 0 1px 0 var(--rose-pink)`).

- **Graphify Agent Skill**:
  - Create `.agents/skills/graphify/SKILL.md` documenting Graphify commands, AST graph generation, and querying workflows.
  - Add indexing scripts in `scripts/` (e.g. `scripts/graphify-index.js` or shell runner) for repository analysis.

## Testing Decisions

- **Testing External Behavior at the Highest Seams**:
  - **Live Background Scope Seam (`SettingsModal.test.tsx`, `themeService.test.ts`)**: Verify switching between "Full App" and "Sidebar Only" scope, verifying that `.has-sidebar-live-bg` or `.has-live-bg` classes and CSS variables are correctly applied to the DOM.
  - **Sidebar Aesthetics & Interaction Seam (`TaskDashboardSidebar.test.tsx`, `SidebarTree.test.tsx`)**: Verify active note highlight, glassmorphism class presence, and section expand/collapse.
  - **Editor Code Block & Badge Spacing Seam (`EditorPane.test.tsx`, `LexicalEditorTheme.test.ts`)**: Verify multi-line code blocks render with block layout, copy button functions, and task lines maintain distinct vertical separation without overlapping.
  - **Split View Divider & Focus Seam (`DualColumnLayout.test.tsx`)**: Verify divider drag resizing, active pane top accent indicator, and focus switching between left and right panes.
  - **Global Shortcut & Tray Seam (`globalShortcutService.test.ts`)**: Verify shortcut string normalization for diverse OS event payloads and window focus dispatch logic.

## Out of Scope

- In-app visual interactive wikilink Graph View (scheduled for v2.0.0).
- Third-party cloud sync or online real-time collaboration (handled offline via `.zip` Vault Archive).
- Full custom syntax highlighting themes editor (built-in themes Nordic, Dracula, Rosé Pine, Catppuccin, Gruvbox provide comprehensive palette coverage).

## Further Notes

- All changes are backward compatible with existing Markdown notes, frontmatter metadata, and Dashboard queries.
