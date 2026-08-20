# 03 — Task Drag Restrictions: Keep Done Tasks Within Note

**What to build:** Completed tasks (`- [x]`) must only be draggable to reorder their position within their containing Note. If a user attempts to drag a completed task onto another file in the sidebar file tree, the drop target must reject the drop with a `not-allowed` cursor and leave the source task intact. Open/pending tasks remain free to move across files in the sidebar tree.

**Blocked by:** None — can start immediately.

**Status:** Done

- [x] Task drag data payload includes the task state (`todo`, `in_progress`, `blocked`, `completed`).
- [x] Completed (`completed` / `- [x]`) tasks can be dragged and dropped to reorder positions inside their current note editor.
- [x] Sidebar file tree drop targets reject drops of completed tasks with `not-allowed` feedback and do not invoke file transfer handlers.
- [x] Open and in-progress tasks continue to support moving across notes via the sidebar tree.
- [x] Automated tests in `SidebarTree.test.tsx` and `EditorPane.test.tsx` pass.
