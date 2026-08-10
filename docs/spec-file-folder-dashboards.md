# Feature Spec: File & Folder System and Custom Task Dashboards

## Problem Statement

Currently, the checklist application manages Markdown files in a flat structure without support for nested directory hierarchies (folders), custom visual categorization, or user-configurable task views. Users managing complex projects need a way to organize their Notes into multi-level Folders and create custom Task Dashboards to aggregate, filter, and track Tasks across their entire Vault based on specific tags, state, and folder paths.

## Solution

1. **Vault File & Folder System**: Support arbitrary nesting of Folders in the Vault with full sidebar navigation (create, rename, delete, move via drag-and-drop) and custom icon indicators distinguishing Notes from Dashboards.
2. **Custom Task Dashboards**: Enable users to create plain-text `.dashboard.md` files (or `.md` with YAML frontmatter `type: dashboard`) inside the Vault that define multi-section widget grids.
3. **Recursive Folder Scoping**: Enable Task Dashboard queries to filter tasks by folder paths (e.g. `folder: "Projects/Client-A"`), automatically aggregating tasks from sub-folders recursively.
4. **Interactive Dashboard View**: Provide a dedicated interactive Dashboard UI with real-time checkbox state toggling (updating source Markdown files on disk), task-to-note navigation links, and a header toggle to switch into raw YAML frontmatter source mode.

## User Stories

1. As a user, I want to organize my notes inside nested folders within my Vault, so that I can keep my projects and notes logically structured.
2. As a user, I want to create new folders directly from the sidebar UI, so that I can structure my Vault without leaving the application.
3. As a user, I want to create new Notes inside specific folders, so that my new content is placed in the correct location immediately.
4. As a user, I want to rename folders and notes from the sidebar, so that I can update my project organization as requirements change.
5. As a user, I want to delete folders and notes from the sidebar, so that I can clean up obsolete files.
6. As a user, I want to drag and drop notes or sub-folders into another folder in the sidebar, so that I can quickly re-organize my file tree.
7. As a user, I want to create specialized Task Dashboard files saved inside my Vault, so that my dashboard configurations are persistent, portable, and version-controllable alongside my notes.
8. As a user, I want to see distinct visual icons for regular Notes vs Task Dashboards in the sidebar tree, so that I can quickly spot my dashboards.
9. As a user, I want a quick-access strip at the top of the sidebar listing my pinned/favorite Dashboards, so that I can switch between dashboards with 1-click.
10. As a user, I want a Dashboard to support multiple query sections (widgets), so that I can group tasks by status, priority, or category side-by-side.
11. As a user, I want Dashboard sections to filter tasks by folder scope (including recursive sub-folder matches), so that top-level dashboards automatically include tasks from nested project folders.
12. As a user, I want Dashboard sections to filter tasks by Task State (`open`, `in_progress`, `blocked`, `completed`), so that I can focus only on actionable or blocked work.
13. As a user, I want Dashboard sections to filter tasks by Tag (e.g. `#urgent`, `#bug`), so that I can aggregate cross-cutting task priorities across all notes.
14. As a user, I want to group tasks within a Dashboard section by Folder, Note, Tag, or State, so that the information is structured intuitively.
15. As a user, I want to toggle task checkboxes directly inside a Task Dashboard, so that the underlying Markdown source Note on disk is updated in real-time without opening the note.
16. As a user, I want to click on a task title or note link within a Dashboard, so that I can immediately open and edit the source Note in the primary note editor.
17. As a user, I want to toggle a Dashboard between Interactive View mode and Raw Source mode, so that I can manually edit the underlying YAML frontmatter definition if desired.

## Implementation Decisions

- **Domain Glossary Alignment**: Respects domain definitions in `CONTEXT.md` (`Vault`, `Note`, `Folder`, `Task`, `Dashboard`, `Dashboard Section`).
- **Architectural Standards**: Respects [ADR 0002](file:///d:/Projects/checklist-app/docs/adr/0002-dashboard-vault-storage.md) (Vault file storage for Dashboards) and [ADR 0003](file:///d:/Projects/checklist-app/docs/adr/0003-dashboard-layout-and-folder-scoping.md) (Multi-section grid & recursive scoping).
- **Workspace & File System Layer**:
  - Extend workspace scanner to build a nested directory tree model representing Folders, Notes, and Dashboards.
  - Implement file operations (create folder, create dashboard file, move file/folder, rename, delete) using Tauri FS IPC commands when running natively, and mock memory storage when running in web browser fallback mode.
- **Dashboard Schema**:
  - Dashboard files use YAML frontmatter syntax:
    ```yaml
    ---
    type: dashboard
    title: Project Overview
    sections:
      - id: sec-1
        title: In Progress
        filter:
          state: [in_progress]
          folder: "Projects"
          recursive: true
        groupBy: folder
        sortBy: state
      - id: sec-2
        title: Urgent Tasks
        filter:
          tags: ["#urgent"]
        groupBy: state
    ---
    ```
- **Task Parsing & Mutation**:
  - Standardize task parsing regex across nested files to recognize task flags `[ ]`, `[-]`, `[>]`, and `[x]`.
  - Provide transactional update helper that updates line flag in the source file on disk upon checkbox click.
- **Sidebar & UI Component Architecture**:
  - Unified Sidebar Tree component rendering collapsible folder nodes, note files, and dashboard files with distinct icon assets.
  - Quick Dashboard Bar at sidebar header.
  - Context menu and drag-and-drop handlers for file/folder management.
  - Dual-mode Dashboard View component: Interactive Widget Grid mode (default) vs Lexical/Plain-text Source Editor mode.

## Testing Decisions

### Good Test Principles

- Test external behavior through public service APIs and component interactions, avoiding internal implementation detail coupling.
- Test both Tauri native mode contracts and mock in-memory web fallback mode.

### Seams for Testing

1. **Primary Seam 1: Domain & Storage Services (`workspaceService`, `fileService`, `dashboardService`)**
   - Unit and integration tests using Vitest.
   - Tests file tree hierarchy generation, YAML frontmatter parsing, recursive folder task filtering, tag filtering, task grouping/sorting, and file state mutation.
2. **Primary Seam 2: Sidebar Tree & Interactive Dashboard Components (`TaskDashboardSidebar`, `DashboardView`)**
   - Component integration tests using Vitest and React Testing Library.
   - Tests tree expand/collapse, file operation triggers, interactive checkbox toggles, section query rendering, and source mode toggle.

### Prior Art

- Existing service tests in `src/services/__tests__/workspaceService.test.ts` and `src/services/__tests__/fileService.test.ts`.

## Out of Scope

- Remote cloud database synchronization (strictly local Vault storage).
- Complex SQL/Dataview JS script execution (sticking to declarative YAML frontmatter query configurations).
- Binary file attachments management inside Dashboards.

## Further Notes

- Future enhancements may add drag-and-drop reordering of Dashboard sections or visual section query wizard builders.
