# 01 — Lift `themeMode` state to shared parent

**What to build:** Move `themeMode` state and its toggle handler out of `TaskDashboardSidebar` and up to the shared parent component (`DualColumnLayout` or `App`). Pass `themeMode` and `onToggleThemeMode` down as props to both `TaskDashboardSidebar` and `TitleBar`. No visible UI changes in this ticket — it is a pure prefactor that makes tickets 02 and 03 possible without a large, tangled diff.

**Blocked by:** None — can start immediately

**Status:** closed

- [x] `themeMode` state and toggle handler live in `DualColumnLayout` (or `App`), not in `TaskDashboardSidebar`
- [x] `TaskDashboardSidebar` accepts `themeMode` and `onToggleThemeMode` as props and behaves identically to before
- [x] `TitleBar` accepts `themeMode` and `onToggleThemeMode` as props (wired but not yet rendered — that is ticket 02)
- [x] All existing tests for `TaskDashboardSidebar` and `TitleBar` pass with the updated prop signatures
- [x] No visible UI change in the running app
