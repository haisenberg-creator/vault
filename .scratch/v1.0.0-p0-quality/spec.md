# Spec: Vault 1.0.0 — P0 Quality & Polish

Status: ready-for-agent

---

## Problem Statement

Vault has four user-visible defects that make it feel rough around the edges at v0.4.0:

1. **Phantom task copy on drag**: dragging a Task near itself duplicates it instead of moving it, leaving the original behind.
2. **Phantom dot marker on task deletion**: creating a Task via one of the four status toolbar buttons and then deleting it leaves a stray `•` bullet marker at the start of the line.
3. **Verbose, cluttered breadcrumb bar**: the sidebar header shows a redundant `TASK DASHBOARD` label and the path displayed in the title bar shows the full absolute filesystem path (e.g. `C:/Users/.../workspace/Projects/Vault.md`), making it hard to know at a glance which Note is open. The `WORKING / ARCADE` mode toggle sits in an awkward location inside the sidebar header rather than the window chrome. There is also no way to quickly copy the path or reveal the Note in the OS file explorer.
4. **Task count aggregates all notes**: the `Tasks (N)` tab label counts Tasks from every Note in the V-Folder, not just the currently open Note, so the number is misleading.

---

## Solution

Fix both bugs at their root cause in the Lexical editor. Redesign the title bar area to shorten the path to the last two path segments, relocate the mode toggle into the window chrome, and expose a right-click context menu on the Note icon. Change the `Tasks (N)` tab to reflect only the currently open Note's Tasks.

---

## User Stories

### Bug: Drag-copy phantom task

1. As a note-taker, I want moving a Task by dragging it to replace it at the new position, so that I don't end up with accidental duplicate Tasks.
2. As a note-taker, I want dragging a Task near itself to be a no-op (or a safe reorder), so that self-adjacent drags don't create phantom copies.
3. As a note-taker, I want the Task list to remain accurate after any drag operation, so that my Task count and progress percentage stay correct.

### Bug: Phantom dot marker after status-button task deletion

4. As a note-taker, I want deleting a Task I created via a status toolbar button to leave the line completely clean, so that stray bullet markers don't corrupt the Note's content.
5. As a note-taker, I want the editor to behave identically whether I created a Task with Enter or with a toolbar button, so that deletion is always predictable.

### Breadcrumb bar cleanup

6. As a note-taker, I want the title bar to show only the short path of my open Note (e.g. `Projects/Vault.md`), so that I can identify the Note at a glance.
7. As a note-taker, I want the `TASK DASHBOARD` label removed from the sidebar header, so that the sidebar feels less cluttered.
8. As a note-taker, I want the `WORKING / ARCADE` mode toggle accessible from the title bar, so that it is always reachable regardless of which sidebar tab is active.
9. As a note-taker, I want to right-click the Note icon in the title bar to see `Copy Path`, `Copy Relative Path`, and `Reveal in File Explorer` options, so that I can quickly act on the open Note's location.

### Task count scoped to current Note

10. As a note-taker, I want the `Tasks (N)` tab label to show the number of Tasks in the currently open Note only, so that I can see at a glance how many Tasks belong to the Note I am editing.
11. As a note-taker, I want the count to update immediately when I open a different Note, so that the number is always accurate.
12. As a note-taker, I want the Tasks tab's filter and sort behaviour to remain unchanged, so that the tab still shows all tasks across the vault — only the label changes scope.

---

## Implementation Decisions

### Bug: Drag-copy phantom task

- The root cause is in the editor's DnD drop handler: when the drag source and drop target resolve to the same or adjacent node, the source removal is skipped or fires before the drop is confirmed. The fix must ensure the source Task node is removed exactly once, after a confirmed drop to a different position.
- Fix is contained within the Lexical DnD command handlers; no data model or sidebar changes needed.

### Bug: Phantom dot marker

- The `NoteActionBar` exposes an `onChangeTaskStatus` callback that triggers Task insertion in `EditorPane`. The Task node created by this path includes a marker node that is not removed when the Task node is deleted.
- Fix: ensure `ChecklistNode` (or its parent list node) cleanup logic removes all associated marker nodes on deletion, matching the cleanup behaviour of Tasks created via the Enter key.

### Breadcrumb bar cleanup

- `TitleBar` already calls `stripWorkspacePrefix`. Truncate the result to the last two path segments (e.g. `Projects/Vault.md`). Single-segment paths display as-is.
- Remove the `TASK DASHBOARD` `<h2>` from `TaskDashboardSidebar`.
- Move the `WORKING / ARCADE` toggle from `TaskDashboardSidebar` into `TitleBar` (right-hand cluster, left of the window controls). This requires lifting `themeMode` state up to the shared parent (`DualColumnLayout` or `App`) and passing it down as a prop.
- Right-click context menu on the Note icon in `TitleBar`: Copy Path, Copy Relative Path, Reveal in File Explorer. Uses the already-installed `@tauri-apps/plugin-opener` for file reveal. Closes on outside click and `Escape`.

### Task count scoped to current Note

- Add an `activeFileTasks` prop to `TaskDashboardSidebar` (a filtered subset of `tasks` matching the active file path). Render `activeFileTasks.length` in the tab label. Tasks tab content remains driven by the full `tasks` prop.
- The caller computes the filtered subset by matching `task.sourceFile` against the active file path.

---

## Testing Decisions

Tests exercise observable UI or output state, not internal Lexical node structure. Prior art: `src/components/editor/__tests__/EditorPane.test.tsx` and `src/components/sidebar/__tests__/TaskDashboardSidebar.test.tsx`.

- **Drag-copy bug**: Simulate a self-adjacent DnD drop; assert `onTasksChange` fires with the original count (no duplicates).
- **Phantom dot bug**: Simulate status-button Task creation then Backspace deletion; assert `onTasksChange` fires with zero tasks and markdown output contains no stray `•` character.
- **Breadcrumb path shortening**: Render `TitleBar` with a long absolute path; assert displayed text matches the last two segments only.
- **TASK DASHBOARD removal**: Assert the text `TASK DASHBOARD` is absent from `TaskDashboardSidebar` rendered output (update the existing test that currently asserts its presence).
- **Mode toggle in TitleBar**: Assert the toggle button renders inside `TitleBar`, not inside `TaskDashboardSidebar`.
- **Right-click context menu**: Simulate right-click on Note icon; assert the three menu items are visible.
- **Task count scoping**: Render `TaskDashboardSidebar` with 10 `tasks` and 3 `activeFileTasks`; assert tab label reads `Tasks (3)`.

---

## Out of Scope

- P1 and P2 features (keyboard shortcuts, tag system, rich text toolbar, themes, split view, graph view) — separate specs.
- `themeMode` persistence mechanism is unchanged; only the toggle's render location moves.
- Tasks tab content behaviour is unchanged; only the label count changes scope.
- Sync — deferred from 1.0.0.

---

## Further Notes

- Moving `themeMode` state up will require updating test setup for both `TaskDashboardSidebar` and `TitleBar` tests.
- The `Reveal in File Explorer` action uses `@tauri-apps/plugin-opener`, already in `package.json`.
