# 06 — Fix phantom dot marker after status-button task deletion

**What to build:** Creating a Task via one of the four status toolbar buttons (Open, In Progress, Blocked, Done) and then deleting it leaves a stray solid dot `•` marker at the start of the line. Fix the Lexical node cleanup so that deleting a status-button-created Task removes all associated marker nodes — producing a completely clean line, identical to deleting a Task created with the Enter key.

**Blocked by:** None — can start immediately

**Status:** closed

- [x] Deleting a Task created via any of the four status toolbar buttons leaves no stray `•` (or any other marker character) on the line
- [x] The resulting markdown output for the Note contains no stray bullet characters after the deletion
- [x] Deleting a Task created via the Enter key continues to work correctly (no regression)
- [x] Deleting a Task created via the toolbar `+ New Task` button continues to work correctly (no regression)
- [x] `onTasksChange` fires with zero tasks after the only task in a Note is deleted, regardless of creation method
- [x] Test: simulate status-button Task creation (via `onChangeTaskStatus`) then Backspace/Delete; assert `onTasksChange` fires with zero tasks
- [x] Test: assert the editor markdown output contains no `•` character after deletion
- [x] Test: existing Enter-key Task deletion test still passes (no regression)
