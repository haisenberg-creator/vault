# 02 — Breadcrumb bar: path shortening, TASK DASHBOARD removal, mode toggle relocation

**What to build:** Three visible changes to the app chrome that make the interface feel cleaner and less cluttered.

1. The title bar path badge now shows only the last two path segments of the open Note (e.g. `Projects/Vault.md` instead of the full absolute path). Single-segment paths show as-is.
2. The `TASK DASHBOARD` heading is removed from the sidebar header. The header row can be collapsed or repurposed.
3. The `WORKING / ARCADE` mode toggle button moves from the sidebar header into the TitleBar right-hand cluster (to the left of the window controls, separated by a subtle divider).

**Blocked by:** 01 — Lift `themeMode` state to shared parent

**Status:** ready-for-agent

- [ ] TitleBar path badge displays only the last two path segments; long absolute paths are truncated correctly
- [ ] Single-segment paths display correctly (no leading slash or empty segment)
- [ ] `TASK DASHBOARD` text is absent from the rendered sidebar
- [ ] Mode toggle button renders inside TitleBar (right cluster), not inside `TaskDashboardSidebar`
- [ ] Toggling the mode from TitleBar updates the theme correctly across both sidebar and editor
- [ ] Existing test that asserts `TASK DASHBOARD` is present is updated to assert it is absent
- [ ] Existing test that asserts the toggle is in `TaskDashboardSidebar` is updated to reflect its new location
- [ ] New TitleBar test asserts the toggle renders and fires `onToggleThemeMode` on click
- [ ] New TitleBar test asserts the path badge shows only the last two segments given a long path prop
