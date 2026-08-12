# 02 — Smart Drag-and-Drop

**What to build:** The core write-path. When you drag a categorized task from the Dashboard and drop it into a different Note in the sidebar, the file mutator intelligently locates (or creates) the correct Priority Header in the destination file and appends the task underneath it.

**Blocked by:** 01 — Priority Parsing & Dashboard Filtering

**Status:** done

- [x] Dashboard `onDragStart` JSON payload includes the task's `priority` metadata.
- [x] Dropping a task with priority onto a Note invokes a smart appending function.
- [x] Smart append finds the existing matching Priority Header in the Note and appends the task beneath it without mangling existing text.
- [x] If no matching Priority Header exists, one is appended to the bottom of the file along with the task.
