# 06: Collapsible and Resizable Sidebar Shell with Responsive Reflow

**What to build:** Allow users to collapse the sidebar into 0px Zen mode or resize it smoothly by dragging its divider between 200px and 480px, with fluid reflow of inner components and session state persistence.

**Blocked by:** 05: Workspace Session Persistence Engine

**Required skills:** `implement`, `design-taste-frontend`, `emil-design-eng`

**Status:** resolved

- [x] Add a vertical resize divider handle along the right edge of `TaskDashboardSidebar` with `cursor: col-resize` and tactile hover/drag glow.
- [x] Implement mouse drag handlers clamping sidebar width between minimum 200px and maximum 480px (default 280px).
- [x] If dragged narrower than 160px during an active drag, trigger auto-collapse.
- [x] Collapsing the sidebar sets width to 0px with `overflow: hidden` and smooth CSS transition.
- [x] Register `Ctrl+B` (and `Cmd+B` on macOS) shortcut to toggle sidebar collapse/expand.
- [x] Add a sidebar toggle button in the Title Bar or navigation header to uncollapse the sidebar when hidden.
- [x] Inner sidebar components (filter pills, stat counters, action icon rows) reflow responsively using `flex-wrap: wrap` and fluid widths without producing horizontal scrollbars.
- [x] Sidebar width and collapse state are saved to and restored from `sessionService`.
- [x] Integration tests in `DualColumnLayout.test.tsx` verify keyboard toggle, drag resizing, boundary clamping, and session persistence.
