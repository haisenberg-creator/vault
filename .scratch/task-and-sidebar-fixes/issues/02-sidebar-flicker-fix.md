# 02 — Fix Drag-and-Drop Sidebar Flickering

**What to build:** Dragging notes across the folder/root boundaries in the sidebar feels stable without the UI infinitely flickering back and forth.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] When dragging a note over a folder in the sidebar, the visual drop indicator (e.g., highlight or outline) does not shift the height or layout of the tree node.
- [ ] Hovering exactly on the boundary between a folder node and the root space does not cause rapid visual flickering or infinite loop re-renders.
