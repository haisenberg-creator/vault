# 05: Workspace Session Persistence Engine

**What to build:** Persist the user's active working context—open notes, split view ratio, sidebar width, expanded folders, and filters—across app restarts using local browser storage, with graceful recovery if files are modified externally.

**Blocked by:** None (can start immediately)

**Required skills:** `implement`, `tdd`

**Status:** resolved

- [x] Create a dedicated session service (`sessionService.ts`) to manage loading, saving, and validating `vault_session_v2` in `localStorage`.
- [x] Session state model includes:
  - `activeFilename`: string
  - `isSplitView`: boolean
  - `rightFilename`: string
  - `splitRatio`: number
  - `isSidebarCollapsed`: boolean
  - `sidebarWidth`: number
  - `expandedPaths`: string[]
  - `activeFilter`: TaskState | "all"
  - `activeTagFilter`: string | null
- [x] Saving is debounced (150ms) to avoid performance degradation during rapid divider dragging or typing.
- [x] On application initialization in `DualColumnLayout`, restore saved state after workspace files load.
- [x] If a saved `activeFilename` or `rightFilename` no longer exists on disk (e.g. deleted while Vault was closed), prune the missing path and fall back to the first available note or empty state without throwing an error.
- [x] Unit tests verify serialization, deserialization, debounced persistence, and graceful fallback for deleted files.
