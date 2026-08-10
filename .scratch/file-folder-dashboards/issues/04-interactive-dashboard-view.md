# 04 — Interactive Dashboard View & Source Toggle UI

**What to build:** Opening a Dashboard file displays a multi-section widget grid where users can interactively toggle task checkboxes to update the source Markdown file on disk in real time. Clicking task titles opens the target source Note in the editor, and a top header toggle allows switching between the visual Dashboard View and the raw YAML Source editor.

**Blocked by:** 02 — Unified Sidebar Tree & File Management UI, 03 — Dashboard Schema Parsing & Task Query Engine

**Status:** ready-for-agent

- [ ] Render responsive multi-section widget grids based on parsed Dashboard section definitions.
- [ ] Interactive task checkboxes update the task state in the underlying Markdown note file on disk immediately.
- [ ] Clicking a task title or note link navigates to and loads that Note in the Lexical editor.
- [ ] Header toggle switches between Interactive Dashboard View and Raw Source Mode.
- [ ] UI component integration tests verifying section grid rendering, checkbox state updates, and mode toggling.
