# 05 — Fix Drag-and-Drop Task Duplication

**What to build:** When dragging a task out of the currently active note into another note, the task is reliably removed from the original note without randomly duplicating upon auto-save.

**Blocked by:** 03, 04

**Status:** completed

- [x] Dragging a task from the active editor note to another note in the sidebar successfully appends the task to the destination note.
- [x] The dragged task is immediately and reliably deleted from the active editor's internal state.
- [x] Wait for autosave or manually save the active note—the deleted task does not reappear or duplicate back into the active note.
