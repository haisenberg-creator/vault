# 08: Note Outline Mind Map View

**What to build:** Provide users with an interactive, bird's-eye Mind Map visual outline of the active note derived dynamically from its Markdown headings (`#`, `##`, `###`), allowing spatial navigation and click-to-scroll section jumping without heavy third-party dependencies.

**Blocked by:** 03: Task Hanging-Indent Flex Layout and 4-Tier Priority Headers

**Required skills:** `implement`, `design-taste-frontend`, `emil-design-eng`

**Status:** resolved

- [x] Build an AST outline extractor that extracts heading nodes (`level`, `text`, `key`) from the current Lexical document state.
- [x] Add a dedicated Mind Map toggle button (icon: `Network` / `GitFork`) to `NoteActionBar`.
- [x] Render a lightweight, reactive SVG tree layout displaying heading nodes connected by organic branches styled with Rose Pine palette accents.
- [x] Clicking any node in the Mind Map smoothly scrolls the editor to that specific heading element in the DOM.
- [x] Mind Map updates dynamically in real-time as headings are added, renamed, or deleted in the editor.
- [x] Zero external canvas/mind-mapping libraries used (bundle footprint < 15KB).
- [x] Component and interaction tests in `NoteActionBar.test.tsx` and `EditorPane.test.tsx` verify toggle state, heading tree extraction, and click-to-scroll event emission.
