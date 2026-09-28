Status: ready-for-agent
Labels: ready-for-agent

# Specification: Vault v2.0.0 — Mind Map Outline, Selective Archive, Workspace Session & UI Polish

## Problem Statement

Users of Vault operating at higher scale and longer session durations experience several critical friction points across navigation, workspace continuity, note visualization, and data safety:

1. **Lack of Visual Note Structure Navigation (Mind Mapping)**: When working in long, structured notes with multiple heading tiers (`#`, `##`, `###`), users have no spatial, bird's-eye representation of their document outline. Switching between sections requires manual vertical scrolling, breaking mental context.
2. **Loss of Workspace Session on Reopening**: Every time Vault is closed or restarted, users lose their entire working context—active open notes, split view panes and divider ratios, sidebar width and collapse state, expanded folder trees, and task/tag filters reset to blank or default values.
3. **Coarse, All-or-Nothing Archive Export**: Exporting a Vault Archive currently dumps the entire V-Folder into a `.zip` file without allowing the user to select specific folders or notes. Users who want to share a single folder or a curated set of notes cannot do so without manually manipulating zip files or copying folders in their OS file explorer.
4. **Visual Clutter from File Extensions in Sidebar**: The navigation sidebar displays raw filesystem names (e.g. `meeting.md`, `overview.dashboard.md`), cluttering the visual hierarchy with redundant extension suffixes rather than clean document titles.
5. **Rigid Sidebar Layout & Resizing Constraints**: The sidebar width is fixed and cannot be collapsed into a distraction-free Zen mode or resized by dragging. Narrow or wide screen layouts cannot adapt, and inner elements (filter pills, stat counters) do not reflow responsively.
6. **Awkward Task Status Wrapping in Split View Panes**: In narrow editor panes (such as Split View), long task items break clumsily across lines—the status badge (`[ OPEN ]`, `[ IN PROGRESS ]`) wraps onto an isolated line or pushes task text downward rather than maintaining a clean, hanging-indent block layout.
7. **Squished Sidebar Tree Icons on Long Filenames**: When a note or folder has a long name, CSS flexbox shrinks the 16×16px file/folder icon into an illegible sliver instead of truncating the label text with an ellipsis.
8. **Incomplete Priority Header Hierarchy & Styling**: Only `## Urgent`, `## High`, and `## Low` headers receive priority decoration, leaving `## Medium` unrepresented and generic Level-2 headings lacking distinct visual separation from priority headers.
9. **Missing Folder Creation Shortcut**: While notes can be created rapidly with `Ctrl+N` / `Cmd+N`, creating a folder requires mouse navigation to the sidebar button, interrupting keyboard-driven workflows.
10. **Absence of Strict Performance & Resource Constraints**: As Vault grows in features, there are no documented, enforceable quantitative budgets for memory, bundle size, and scale invariants to guard against resource regressions.

## Solution

Vault v2.0.0 delivers a cohesive suite of high-performance capabilities, layout ergonomics, and visual polish:

1. **Note Outline Mind Map View**: A localized, zero-runtime-dependency SVG mind map generated dynamically from the active note's Markdown heading hierarchy (`#`, `##`, `###`). Toggled from the Note Action Bar, it renders in an adjacent panel or side pane, allowing users to visually inspect document hierarchy and click any node to smoothly scroll the editor to that section.
2. **Complete Workspace Session Persistence**: Automatic, silent caching of transient UI layout state to local browser storage (`vault_session_v2`). On relaunch, Vault seamlessly restores left and right split-pane active notes, divider ratios, sidebar width, collapsed state, expanded sidebar folder paths, and active task/tag filters, with safe fallbacks if files were modified externally.
3. **Selective Archive Export Modal**: A dedicated export modal featuring an interactive hierarchical folder/note tree with tri-state parent checkboxes, a master "Select All / Deselect All" toggle, a selected item counter, and a one-click action that packages the selected subset into a standard `.zip` archive while preserving relative folder hierarchy.
4. **Clean Sidebar Display (Extension Masking)**: The sidebar tree strips `.md` and `.dashboard.md` extensions from display labels while keeping the underlying filesystem paths, wikilinks, and file creation/renaming contracts fully intact.
5. **Collapsible & Resizable Sidebar with Responsive Reflow**: A draggable vertical divider allowing smooth resizing between 200px and 480px (with auto-collapse below 160px), a one-click collapse button, and a global `Ctrl+B` / `Cmd+B` shortcut for 0px Zen mode. Sidebar elements automatically reflow and adapt across widths.
6. **Hanging-Indent Task Flex Layout**: Refactored task checklist rendering using flex containers (`align-items: flex-start`), keeping status badges anchored top-left with `flex-shrink: 0` while task text wraps neatly in an aligned text block across any pane width.
7. **Rigid 16px Tree Icon Geometry**: Tree icons (`FileText`, `Folder`, `LayoutDashboard`) locked with `flex-shrink: 0`, ensuring they remain crisp and unwarped regardless of label length.
8. **Unified 4-Tier Priority Header Matrix**: Full priority header styling covering `## Urgent` (Rose Love), `## High` (Rose Gold), `## Medium` (Rose Foam), and `## Low` (Rose Pine), with generic Level-2 headers receiving a clean, neutral subtle border.
9. **Dedicated Folder Creation Shortcut**: `Ctrl+Shift+N` (and `Cmd+Shift+N`) registered locally to prompt for folder creation within the currently active folder or vault root.
10. **Formally Codified Performance Invariants in Domain Docs**: Explicit quantitative budgets documented in `CONTEXT.md`: idle RAM < 120MB, production bundle < 2MB, zero background daemons, zero telemetry, and virtualized/lazy file handling for > 10,000 notes.

## User Stories

1. As a user working in a complex note, I want to toggle a Mind Map View from the note action bar, so that I can see an interactive visual tree of all my headings and subheadings.
2. As a user viewing the Mind Map, I want clicking any heading node to jump directly to that heading in the editor, so that I can navigate long notes effortlessly.
3. As a user editing my note, I want the Mind Map tree to update in real-time as I add, edit, or delete headings, so that my visual outline is always synchronized with my content.
4. As a performance-conscious user, I want the Mind Map to be rendered using lightweight SVG without third-party canvas engines, so that memory usage remains negligible.
5. As a user closing and reopening Vault, I want the app to reopen with the exact note(s) I was working on, so that I do not lose my train of thought.
6. As a user working in Split View, I want my left pane note, right pane note, and split divider ratio to be remembered across restarts, so that my side-by-side editing layout is preserved.
7. As a user organizing my files, I want my expanded and collapsed folders in the sidebar tree to remain in the same state when I relaunch Vault, so that I do not have to re-expand deep folder trees.
8. As a user filtering tasks by state or tag in the sidebar, I want my active filter to persist across app restarts, so that my focused task dashboard is immediately ready.
9. As a user who deleted a note in the filesystem while Vault was closed, I want Vault to safely detect the missing note and gracefully fall back to the first available note or empty state without crashing.
10. As a user wanting to back up or share only a subset of my notes, I want to click "Sync / Export Vault Archive" and see an interactive checklist of all my folders and notes.
11. As a user in the Export Archive modal, I want to click a "Select All" button to quickly check all items, or a "Deselect All" button to start from a blank slate.
12. As a user selecting a folder in the Export Archive modal, I want checking the folder to automatically select all child notes and sub-folders within it.
13. As a user unchecking a single note inside a selected folder, I want the parent folder checkbox to show an indeterminate state, so that I clearly know a partial selection is active.
14. As a user exporting an archive, I want the generated `.zip` file to maintain the exact folder hierarchy of the selected files relative to the V-Folder root.
15. As a user exporting an archive, I want both standard `.md` notes and `.dashboard.md` task dashboards to be selectable and exportable.
16. As a user scanning the sidebar, I want note names to be displayed without the trailing `.md` extension, so that the file tree looks clean and easy to read.
17. As a user scanning dashboards in the sidebar, I want dashboard files to display without `.dashboard.md`, so that their title is concise while their distinct dashboard icon identifies their type.
18. As a user creating or renaming a note, I want to type a title without being forced to type `.md` manually, while Vault guarantees the file is saved with the correct extension on disk.
19. As a user writing wikilinks, I want `[[My Note]]` to resolve transparently to `My Note.md`, matching what I see in the sidebar.
20. As a user with a long note title, I want the icon next to the title in the sidebar tree to stay crisp and full-sized (16×16px), with the text truncating smoothly with an ellipsis.
21. As a user in a narrow screen or focusing deeply on writing, I want to press `Ctrl+B` (or `Cmd+B`) to collapse the sidebar to 0px, maximizing my editor canvas.
22. As a user with a collapsed sidebar, I want a visible toggle button in the title bar or a left-edge affordance to quickly reopen the sidebar with a click or keyboard shortcut.
23. As a user customizing my layout, I want to drag the boundary between the sidebar and the editor to adjust sidebar width between 200px and 480px.
24. As a user resizing the sidebar, I want my custom sidebar width to be saved automatically, so that it remains at my preferred width on next launch.
25. As a user dragging the sidebar narrower than 160px, I want it to snap smoothly into the collapsed state.
26. As a user resizing the sidebar wider or narrower, I want the sidebar stats, filter buttons, and action icons to reflow cleanly without clipping or producing horizontal scrollbars.
27. As a user editing tasks in Split View, I want task status badges (`[ OPEN ]`, `[ IN PROGRESS ]`, `[ BLOCKED ]`, `[ DONE ]`) to remain pinned at the top-left of the task, with multi-line task text wrapping cleanly beneath itself in a hanging-indent block.
28. As a user organizing tasks by priority, I want `## Medium` headers to be styled in distinct Rose Pine Foam (`#9ccfd8`), completing the priority hierarchy alongside `## Urgent`, `## High`, and `## Low`.
29. As a user writing general notes, I want generic Level-2 headers (`## Overview`) to have a clean, neutral styling that does not clash with semantic priority headers.
30. As a keyboard-first user, I want to press `Ctrl+Shift+N` (or `Cmd+Shift+N`) to instantly open the Create Folder modal targeting the currently selected folder or vault root.
31. As an open-source contributor or maintainer, I want the performance invariants in `CONTEXT.md` to be explicit and measurable, so that no future pull request introduces memory leaks or bloats the bundle past 2MB.

## Implementation Decisions

### 1. Workspace Session Persistence Engine

- Store session state in browser `localStorage` under the key `vault_session_v2`.
- The session state shape captures:
  - `activeFilename`: string
  - `isSplitView`: boolean
  - `rightFilename`: string
  - `splitRatio`: number
  - `isSidebarCollapsed`: boolean
  - `sidebarWidth`: number
  - `expandedPaths`: string[]
  - `activeFilter`: TaskState | "all"
  - `activeTagFilter`: string | null
- On application initialization, load and validate the session state against the active file tree. If a recorded file no longer exists, safely prune it and fall back to the first available note.
- Debounce storage updates (150ms) to eliminate disk write churn during rapid layout adjustments or divider dragging.

### 2. Note Outline Mind Map View

- Implement an SVG-based tree visualizer component that parses the Markdown heading AST (`#`, `##`, `###`, `####`) of the active note.
- Expose an invocation button in the editor's Note Action Bar (icon: `Network` or `GitFork`) with tooltip "Toggle Mind Map Outline".
- Layout: Can be toggled as an adjacent split panel beside the active note or a side inspector.
- Each node renders heading level, title, and child branches.
- Clicking any node dispatches a smooth-scroll command to the corresponding Lexical heading element in the editor DOM.
- Strictly zero external canvas libraries (e.g. cytoscape, mermaid, d3-force); built using pure reactive SVG and CSS transforms to guarantee < 15KB bundle footprint.

### 3. Selective Archive Export Modal

- Replace the blind one-click export action with an interactive Export Archive dialog.
- Tree component with tri-state checkboxes:
  - Unchecked: node and all descendants excluded.
  - Checked: node and all descendants included.
  - Indeterminate: some children checked, some unchecked.
- Header toolbar in modal includes:
  - "Select All" / "Deselect All" master toggle button.
  - Selected item counter ("X notes, Y folders selected").
  - "Export (.zip)" primary action button.
- Export service filters the workspace file tree by selected paths and produces a `.zip` archive containing both `.md` notes and `.dashboard.md` files with relative folder paths.

### 4. Sidebar Extension Truncation & Icon Geometry

- In the sidebar tree rendering module, format the display name of file nodes:
  - If filename ends in `.dashboard.md`, strip `.dashboard.md`.
  - If filename ends in `.md`, strip `.md`.
  - For all other files, display the filename as-is.
- Preserve full filename on disk and in data attributes (`data-filepath`).
- In tree item flex containers, apply `flex-shrink: 0` to all leading icons (`Folder`, `FolderOpen`, `FileText`, `LayoutDashboard`).
- Ensure label text has `flex: 1`, `overflow: hidden`, `text-overflow: ellipsis`, and `white-space: nowrap`.

### 5. Resizable & Collapsible Sidebar Shell

- Sidebar container width managed as dynamic state (`sidebarWidth`, default 280px).
- Add a draggable divider handle (`cursor: col-resize`) along the right edge of the sidebar with active drag styling.
- Clamping rules: minimum 200px, maximum 480px. If dragged below 160px during an active drag, trigger collapse.
- Collapse state toggles `sidebarWidth` to 0px with `overflow: hidden` and smooth CSS transition.
- Register `Ctrl+B` / `Cmd+B` shortcut globally across the window to toggle sidebar collapse.
- Add a sidebar toggle icon in the Title Bar / navigation header to restore the sidebar when collapsed.
- Sidebar internal subcomponents (stats badges, filter pills, action buttons) styled with `flex-wrap: wrap` and fluid container widths to reflow smoothly across resizing.

### 6. Task Flex Alignment & Hanging Indent

- Refactor the task item / checklist node wrapper to a flex row:
  - Container: `display: flex; align-items: flex-start; gap: 6px;`
  - Status badge pill: `flex-shrink: 0; margin-top: 2px;`
  - Task title content: `flex: 1; min-width: 0; word-break: break-word;`
- Ensures that when text wraps in narrow panes (Split View), lines wrap neatly underneath the text block without pushing or orphaning the status badge.

### 7. Expanded Priority Header Hierarchy

- Update editor decoration plugins and global stylesheets to recognize four explicit priority levels:
  - `## Urgent` → `var(--rose-love)` (`#eb6f92`)
  - `## High` → `var(--rose-gold)` (`#f6c177`)
  - `## Medium` → `var(--rose-foam)` (`#9ccfd8`)
  - `## Low` → `var(--rose-pine)` (`#31748f`) or `var(--rose-subtle)` (`#908caa`)
- Generic `##` headings that do not contain priority keywords receive standard neutral heading styling with a subtle border bottom (`1px solid var(--rose-border-color)`).

### 8. Folder Creation Shortcut

- Register `Ctrl+Shift+N` (and `Cmd+Shift+N` on macOS) in the main window keydown listener.
- Handler opens the existing `FileOperationModal` preset to `create-folder`, setting the target path to the currently focused folder or root.

### 9. Core Principles Documentation

- Update `CONTEXT.md` with explicit quantitative constraints:
  - Idle RAM ceiling < 120MB.
  - Production frontend bundle < 2MB.
  - Strictly zero background synchronization daemons or external database processes.
  - Scale invariance: virtualized/lazy-loaded file trees capable of fluid rendering for vaults exceeding 10,000 files.
  - Plain-text files remain 100% human-readable and clean of proprietary metadata.

## Testing Decisions

### What Makes a Good Test

- Tests must exclusively verify observable external behaviors and user interactions: DOM output, keyboard shortcuts, modal state changes, zip archive contents, and local storage contracts.
- Tests must NEVER couple to private component implementation details, internal helper function signatures, or styling hex values.

### Modules to Test

1. **Workspace Session Persistence**: Verify that mounting the layout loads saved session state from local storage, updates state when files or split view change, and falls back safely if stored file paths do not exist.
2. **Note Outline Mind Map**: Verify that clicking the action bar button opens the mind map, parses headings accurately into tree nodes, updates when document content changes, and emits scroll triggers on node click.
3. **Selective Archive Export**: Verify that the export modal renders the hierarchy, toggling parent folder checks/unchecks children, indeterminate states display correctly, "Select All" toggles all checkboxes, and the resulting zip file contains only the selected paths.
4. **Sidebar Display & Icon Geometry**: Verify that notes display without `.md`, dashboards display without `.dashboard.md`, and tree icons have non-zero dimensions with `flex-shrink: 0` regardless of label length.
5. **Sidebar Collapse & Resize**: Verify that pressing `Ctrl+B` toggles collapsed state, dragging divider adjusts width within [200px, 480px] boundaries, and width changes are persisted.
6. **Task Split-View Layout**: Verify that task items render with flex alignment and `flex-shrink: 0` on the status badge across narrow container widths.
7. **Priority Headers**: Verify that `## Medium` receives foam/medium priority decoration in DOM attributes, alongside `## Urgent`, `## High`, and `## Low`.
8. **Folder Shortcut**: Verify that pressing `Ctrl+Shift+N` opens the folder creation modal with mode `create-folder`.

### Prior Art

- `src/components/layout/__tests__/DualColumnLayout.test.tsx`: Prior art for layout mounting, split view state, and shortcut listeners.
- `src/components/sidebar/__tests__/SidebarTree.test.tsx` and `TaskDashboardSidebar.test.tsx`: Prior art for sidebar tree rendering, drag-and-drop, and export archive actions.
- `src/services/__tests__/fileService.test.ts`: Prior art for file tree parsing and zip archive generation.
- `src/components/editor/__tests__/EditorPane.test.tsx` and `NoteActionBar.test.tsx`: Prior art for editor toolbar actions and priority header DOM attributes.

## Out of Scope

- **Bidirectional Freeform Graph Editing**: Editing wikilinks or nodes directly inside the force-directed Graph View remains out of scope per ADR 0009.
- **Third-Party Canvas Plugins**: Incorporating heavy graph libraries (e.g. Mermaid runtime, Cytoscape, D3 force engines) into the mind map view is out of scope to preserve our strict bundle and memory budgets.
- **Cloud/Remote Synchronization**: Cloud syncing, accounts, or multi-user collaboration remain out of scope for Vault's local-first plain-text architecture.
- **Custom Heading Syntax Modifiers**: Syntax such as `## Heading {#color}` or frontmatter-defined custom heading colors is out of scope to preserve standard human-readable Markdown.

## Further Notes

- Version 2.0.0 represents a major milestone focusing on deep usability, seamless workspace continuity, and visual polish while maintaining Vault's core identity as a blazing-fast, local-first, plain-text Markdown sanctuary.
