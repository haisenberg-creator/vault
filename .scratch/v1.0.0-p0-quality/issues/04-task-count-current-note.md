# 04 — Task count scoped to current Note

**What to build:** The `Tasks (N)` tab label in the sidebar currently counts Tasks from every Note in the V-Folder. Change it to show only the number of Tasks belonging to the currently open Note, so the count is meaningful at a glance.

The Tasks tab content (the full task list with filters and sorting) is unchanged — only the tab label count is scoped to the active Note.

**Blocked by:** None — can start immediately

**Status:** closed

- [x] `TaskDashboardSidebar` accepts a new `activeFileTasks` prop (a filtered list of `TaskItem` for the currently open Note only)
- [x] The `Tasks (N)` tab label renders `activeFileTasks.length`, not `tasks.length`
- [x] The Tasks tab content (filtered task list, grouping, sorting) continues to use the full `tasks` prop — only the label changes
- [x] The parent caller (DualColumnLayout or App) passes `activeFileTasks` by filtering `tasks` on the active file path (`task.sourceFile` matches active file)
- [x] Switching to a different Note updates the count immediately
- [x] Test: render `TaskDashboardSidebar` with 10 `tasks` (across 3 files) and 3 `activeFileTasks`; assert tab label reads `Tasks (3)`
- [x] Test: existing assertion on `Tasks (N)` count is updated to use the `activeFileTasks` prop
