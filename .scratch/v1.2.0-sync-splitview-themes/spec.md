Status: Done
Labels: Done

# Specification: Device Sync, Split View, Themes & Quality Polish (v1.2.0)

## Problem Statement

Users of Vault need a reliable, offline-first way to synchronize their entire knowledge workspace across devices without relying on third-party cloud accounts or complex database configurations. Furthermore, power users working with interconnected notes frequently need to view and edit two notes simultaneously (Split View) and customize their workspace with distinct visual themes and responsive live backgrounds that don't obscure interface readability.

At the same time, users face several friction points in daily workflows:

1. Importing text files or full archives is restricted by folder-only pickers that hide `.txt` and `.zip` files.
2. Completed ("done") tasks can accidentally be dragged onto other notes in the file tree instead of staying within their parent note.
3. Code blocks within the markdown editor collapse and overlap visually.
4. OS-level global shortcuts (`Ctrl+Alt+N` and `Ctrl+Alt+P`) fail to trigger when Vault is in the background.
5. Editor toolbars are fragmented across stacked rows and use an unintuitive button rather than a clean `PRIORITY:` header format matching `STATUS:`.

## Solution

Vault provides a cohesive suite of features and quality fixes:

1. **Device-to-Device Sync via Vault Archive**: One-click export of the active V-Folder into a self-contained `.zip` archive, and an intelligent import mechanism that auto-extracts the archive with Replace vs. Merge conflict resolution.
2. **Unified "Import Note/Folder" Experience**: An intuitive popover and drag-and-drop workflow supporting individual `.txt` (auto-converted to `.md`), `.md`, `.zip` archives, and whole directories.
3. **Split View Dual-Pane Layout**: Side-by-side editable panes with draggable divider, active pane focus, and instant pane toggling via toolbar, shortcut (`Ctrl+\`), or context menu.
4. **Restricted Done Task Dragging**: Completed tasks (`- [x]`) can be reordered internally within their containing note, but are blocked from being dragged across files or dropped into sidebar tree nodes.
5. **Curated Themes & Frosted Glassmorphism**: Four new modern palettes (**Catppuccin Mocha**, **Dracula Pro**, **Gruvbox Dark**, **Catppuccin Latte**) and translucent frosted-glass paneling (`backdrop-filter`) that brings Live Backgrounds to life without sacrificing text contrast.
6. **Code Block Layout Fix**: Isolated block styling, pre-wrap whitespace, clean line spacing, and horizontal overflow protection.
7. **System-Wide Global OS Shortcut Fix**: Normalized shortcut token matching for reliable background triggering of New Note and Quick Switcher.
8. **Unified Action Bar**: A consolidated single-row editor toolbar featuring clean uppercase labels (`PRIORITY:`, `STATUS:`), inline badge buttons, and inline text formatting (`B`, `I`, `S`, `==HL==`).

## User Stories

1. As a user, I want to export my entire V-Folder into a standard `.zip` Vault Archive, so that I can easily backup or transfer all my notes and attachments to another device.
2. As a user, I want to import a `.zip` Vault Archive on a new device and choose between replacing or merging, so that I can restore or sync my notes without manual file copying.
3. As a user, I want to click "Import Note/Folder" and see options for importing files/zips or selecting whole folders, so that the OS file dialog doesn't hide text files.
4. As a user, I want imported `.txt` files to automatically convert into `.md` notes, so that plain text files seamlessly integrate into my Vault workspace.
5. As a user, I want to drag and drop `.zip` archives or `.txt` files directly into the sidebar, so that importing is fast and effortless.
6. As a user, I want to split my editor into two side-by-side panes with `Ctrl+\` or a toolbar button, so that I can reference one note while drafting another.
7. As a user, I want each pane in Split View to independently load, edit, and save notes, so that my workflow is completely flexible.
8. As a user, I want clicking a note in the sidebar or Quick Switcher to open in whichever split pane is currently focused, so that navigation is predictable.
9. As a user, I want to adjust the width of the split panes with a draggable divider, so that I can allocate screen space as needed.
10. As a user, I want to close a split pane via an `X` button, so that I can quickly return to single-pane view without losing work.
11. As a user, I want completed (`- [x]`) tasks to be draggable only within the same note for reordering, so that I don't accidentally move archived tasks to other notes.
12. As a user, I want attempts to drag completed tasks onto sidebar files to be visibly rejected, so that I have clear feedback on drag restrictions.
13. As a user, I want to choose from curated palettes like Catppuccin Mocha, Dracula Pro, Gruvbox Dark, and Catppuccin Latte, so that I can personalize my visual environment.
14. As a user, I want active Live Backgrounds to be visible through frosted-glass translucent panels, so that backdrops create a stunning ambient aesthetic.
15. As a user, I want multi-line code blocks in the editor to render with proper line spacing and without overlapping text, so that my code snippets remain legible.
16. As a user, I want pressing `Ctrl+Alt+N` anywhere in the OS to bring Vault to the front and create a new note, so that I can capture quick thoughts instantly.
17. As a user, I want pressing `Ctrl+Alt+P` anywhere in the OS to focus Vault and open the Quick Switcher, so that I can jump to any note from anywhere.
18. As a user, I want a single unified action bar at the top of the editor, so that I don't have multiple cluttered toolbars taking up vertical writing space.
19. As a user, I want to see a clean text label `PRIORITY:` with `[Urgent]`, `[High]`, and `[Low]` buttons, so that priority insertion matches the `STATUS:` formatting.
20. As a user, I want inline formatting buttons (`B`, `I`, `S`, `==HL==`) directly in the main action bar, so that text styling is always accessible with a single click.

## Implementation Decisions

- **Vault Archive & Sync Engine**:
  - Export packages the full workspace directory (excluding system/hidden files) into a standard `.zip` file using `JSZip` / backend archiver.
  - Import detects `.zip` inputs, inspects contained files, converts `.txt` extensions to `.md`, and extracts files into the active V-Folder.
- **Import Mini-Menu UI**:
  - Replaces the single folder input with a dropdown/popover triggered by "Import Note/Folder", offering:
    1. "Import Files / Zip" (`accept=".md,.txt,.text,.zip"`, multiple allowed)
    2. "Import Folder" (directory picker)
- **Split View Architecture**:
  - The main workspace layout manages two active pane states: `primaryPane` and `secondaryPane`.
  - An `activePaneId` ('left' | 'right') tracks focus state to route sidebar clicks and Quick Switcher activations.
  - A draggable splitter bar manages proportional flex widths (`splitRatio`).
- **Drag-and-Drop Task Guard**:
  - Task drag payloads carry a `state` field (`todo` | `in_progress` | `blocked` | `completed`).
  - Drop targets in the sidebar file tree reject drops if `payload.state === 'completed'`.
  - Within `EditorPane`, intra-note reordering remains permitted for all task states.
- **Theme & Glassmorphism Tokens**:
  - Four new theme definitions registered in the theme manager: `catppuccin-mocha`, `dracula-pro`, `gruvbox-dark`, `catppuccin-latte`.
  - CSS variables for surface colors adapt with alpha transparency when `.has-live-bg` is active on `html`.
  - Frosted glass effect applied via `backdrop-filter: blur(16px)` on sidebar, editor header, and cards.
- **Lexical Code Block Formatting**:
  - `.lexical-code-block` styled with `display: block`, `white-space: pre-wrap`, `line-height: 1.6`, `word-break: break-word`, explicit vertical margins, and distinct background/border tokens.
- **Global Shortcut Normalization**:
  - Normalizes shortcut strings in the shortcut service to match platform-specific event identifiers from the OS plugin.
- **Unified Action Bar Layout**:
  - Combines `NoteActionBar` and `FormattingToolbar` into a single consolidated row with section dividers.
  - Priority controls rendered with a `PRIORITY:` label followed by badge buttons.

## Testing Decisions

- **Behavioral Testing at the Highest Seams**:
  - **Layout & Split View Seam (`DualColumnLayout.test.tsx`)**: Verify splitting into two panes, switching active pane focus, loading distinct notes in each pane, adjusting split ratio, and closing split view.
  - **Editor & Unified Toolbar Seam (`EditorPane.test.tsx`, `NoteActionBar.test.tsx`)**: Verify single-row toolbar actions, `PRIORITY:` header insertion, rich text format triggers (`B`, `I`, `S`, `HL`), and code block rendering.
  - **Task Drag Restrictions Seam (`SidebarTree.test.tsx`, `EditorPane.test.tsx`)**: Verify that completed tasks cannot be dropped onto file tree items, while pending tasks move successfully, and completed tasks can reorder within a note.
  - **Import & Archive Seam (`ImportFolder.test.tsx`, `fileService.test.ts`)**: Verify `.zip` extraction, `.txt` to `.md` conversion, folder hierarchy preservation, and file picker popover.
  - **Themes & Backdrops Seam (`SettingsModal.test.tsx`, `themeService.test.ts`)**: Verify switching between all 7 themes, live background opacity/blur changes, and glassmorphic class application.
  - **Global Shortcut Seam (`globalShortcutService.test.ts`)**: Verify shortcut normalization and callback invocation for `Ctrl+Alt+N` and `Ctrl+Alt+P`.

## Out of Scope

- Real-time peer-to-peer WebRTC / CRDT mesh syncing over the internet (offline `.zip` Vault Archive handles device sync).
- 3+ column multi-split views (2-pane split view satisfies desktop side-by-side editing requirements).
- Full WYSIWYG code editor with language LSP server (syntax-highlighted code block with proper line spacing is supported).

## Further Notes

- All changes maintain 100% backward compatibility with existing markdown notes, frontmatter headers, and dashboard widgets.
