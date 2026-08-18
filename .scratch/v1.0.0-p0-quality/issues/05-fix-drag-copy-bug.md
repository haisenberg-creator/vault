# 05 — Fix drag-copy phantom task bug

**What to build:** Dragging a Task near itself (or to an adjacent position) currently leaves the original Task in place and inserts a copy at the drop target, resulting in a duplicate. Fix the drag-and-drop handler so that every drop either moves the Task (source removed, inserted at destination) or is treated as a no-op when source and destination are the same — never producing a duplicate.

**Blocked by:** None — can start immediately

**Status:** closed

- [x] Dragging a Task to a different position moves it (removed from source, inserted at destination) — no duplicate
- [x] Dragging a Task to its own position or an immediately adjacent position is a safe no-op — Task count is unchanged
- [x] `onTasksChange` fires with the same number of tasks before and after a self-adjacent drag
- [x] `onTasksChange` fires with the correct reordered list after a valid cross-position drag
- [x] The task progress percentage in the editor header remains accurate after any drag
- [x] Test: simulate a self-adjacent DnD drop command; assert `onTasksChange` is called with the original task count (no duplicates)
- [x] Test: simulate a cross-position DnD drop; assert the task appears at the new position and is absent from the old one
