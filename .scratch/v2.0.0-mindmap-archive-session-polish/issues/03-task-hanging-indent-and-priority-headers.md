# 03: Task Hanging-Indent Flex Layout and 4-Tier Priority Headers

**What to build:** Fix awkward task status badge wrapping in Split View or narrow editor panes by implementing a hanging-indent flex layout, and expand the priority header hierarchy to include `## Medium` alongside `## Urgent`, `## High`, and `## Low`.

**Blocked by:** None (can start immediately)

**Required skills:** `implement`, `design-taste-frontend`, `tdd`

**Status:** resolved

- [x] Task items / checklist nodes in the editor are structured as flex containers with `align-items: flex-start`.
- [x] Task status badges (`[ OPEN ]`, `[ IN PROGRESS ]`, `[ BLOCKED ]`, `[ DONE ]`) have `flex-shrink: 0`, preventing badges from being compressed or pushed onto isolated lines.
- [x] Task content text has `flex: 1`, `word-break: break-word`, and clean line height, creating a neat hanging indent where multi-line text wraps strictly underneath itself.
- [x] Editor decoration plugin recognizes `## Medium` as a priority header and assigns `data-priority="medium"`.
- [x] Global stylesheet styles `h2[data-priority="medium"]` with Rose Pine Foam (`var(--rose-foam)`, `#9ccfd8`) and matching accent border.
- [x] Generic Level-2 headers (`## Introduction`) that do not contain priority keywords receive standard neutral text styling with a subtle border bottom (`var(--rose-border-color)`), standing distinct from priority headers.
- [x] Unit and component tests in `ChecklistNode.test.tsx` and `EditorPane.test.tsx` verify the flex layout behavior and `data-priority` decoration for all 4 priority levels.
