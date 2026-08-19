# Spec: Vault 1.1.0 — P1 Polish & Core Features

Status: ready-for-agent

---

## Problem Statement

While Vault v1.0.0 established a solid foundation with P0 quality bug fixes, clean breadcrumbs, and scoped task counts, the day-to-day workflow still has several friction points for note-takers:

1. **Lack of keyboard ergonomics**: Power users cannot quickly create notes (`Ctrl+N`), create tasks (`Ctrl+T`), search and jump between notes (`Ctrl+P`), or cycle task statuses (`Alt+S`) without taking their hands off the keyboard. There is also no system-wide quick-capture access from outside the app.
2. **Plain text-only tags**: Hashtags like `#urgent` or `#work` are rendered as plain static text without interactive visual treatment or ability to filter tasks by tag in the Dashboard.
3. **No visible formatting controls**: Casual note-takers have no visual toolbar to apply Markdown-native formatting (bold, italic, strikethrough, highlight) without manually typing Markdown symbols.
4. **Limited file onboarding**: Users migrating notes from other apps cannot import plain text (`.txt`) or Word documents (`.docx`) into their V-Folder without manually converting them outside Vault.
5. **Dull visual hierarchy & limited personalization**: The sidebar lacks visual polish and consistent iconography, and users cannot customize the color theme (e.g. Nord, Tokyo Night) or apply a personal live image/GIF background.
6. **TitleBar and toolbar clutter**: The `Open` button on the task toolbar is redundant (an unchecked checkbox is already open), and the TitleBar layout still displays extra path elements instead of cleanly positioning the `ARCADE / WORKING` toggle beside the app title.

---

## Solution

1. **TitleBar & Toolbar Polish**: Clean up `TitleBar` by removing path text, placing the `ARCADE / WORKING` mode toggle directly beside the app title, and removing the redundant `Open` button from the task action bar.
2. **Hybrid Keyboard Shortcuts & Quick Switcher**: Implement local hotkeys (`Ctrl+N`, `Ctrl+T`, `Ctrl+P`, `Alt+S`) for in-app navigation and editing, a command-palette `Quick Switcher` modal for fuzzy note searching, and OS-level global shortcuts (`Ctrl+Alt+N`, `Ctrl+Alt+P`) via Tauri's global shortcut plugin.
3. **Interactive Tag System**: Parse `#hashtags` in the Lexical editor into interactive clickable pills, and wire tag clicks into a Dashboard filter banner that scopes tasks across the active view.
4. **Rich Text Formatting Toolbar & Highlight Extension**: Add a fixed formatting toolbar above the editor with Bold, Italic, Strikethrough, and Highlight (`==text==`) controls that maintain clean Markdown storage without HTML pollution (per ADR-0008).
5. **Universal Note/Folder Importer**: Expand the sidebar import action to "Import Note/Folder" supporting folders, `.md`, `.txt`, and `.docx` (converted to clean Markdown via `mammoth`).
6. **Sidebar Visual Refresh**: Upgrade sidebar iconography with `lucide-react`, add subtle glassmorphism styling, refined borders, and polished hover interactions.
7. **Settings Modal, Themes & Live Backgrounds**: Provide a dedicated Settings Modal (accessible via a gear icon) with theme selection (Rosé Pine, Nord, Tokyo Night) and custom Live Background image/GIF support.

---

## User Stories

### TitleBar & Toolbar Polish

1. As a note-taker, I want the `Open` button removed from the task toolbar, so that the toolbar only presents meaningful state transitions (`In Progress`, `Blocked`, `Done`).
2. As a note-taker, I want the file path removed from the TitleBar, so that the top bar remains minimal and uncluttered.
3. As a note-taker, I want the `ARCADE / WORKING` mode toggle positioned right next to the `Vault` title in the TitleBar, so that the mode switch is immediately visible in the primary window chrome.

### Hybrid Keyboard Shortcuts & Quick Switcher

4. As a note-taker, I want to press `Ctrl+N` while inside Vault to immediately create and focus a new Note in the current folder, so that I can capture thoughts without clicking buttons.
5. As a note-taker, I want to press `Ctrl+T` while editing to insert a new Task at the cursor position, so that task creation is instantaneous.
6. As a note-taker, I want to press `Ctrl+P` while inside Vault to open the Quick Switcher command palette, so that I can quickly jump to any Note by typing its name.
7. As a note-taker, I want the Quick Switcher to fuzzy-search note titles across the entire V-Folder, so that I can navigate large vaults effortlessly.
8. As a note-taker, I want to navigate Quick Switcher results with `↑ / ↓` and select with `Enter` (or dismiss with `Escape`), so that keyboard-only navigation is smooth.
9. As a note-taker, I want to press `Alt+S` when my cursor is on a Task line to cycle its status (`Open → In Progress → Blocked → Done → Open`), so that I can update task progress without using the mouse.
10. As a note-taker, I want to press `Ctrl+Alt+N` from any application in my OS to bring Vault to the foreground and start a new Note, so that I have frictionless global quick capture.
11. As a note-taker, I want to press `Ctrl+Alt+P` from anywhere in my OS to bring Vault to the foreground with the Quick Switcher open, so that I can jump into my notes from any workflow.

### Interactive Tag System

12. As a note-taker, I want typing `#tag` in my Note to render as a styled, clickable pill, so that tags stand out visually from regular text.
13. As a note-taker, I want clicking a Tag pill in the editor or sidebar to filter the Task Dashboard to only show Tasks containing that tag, so that I can focus on specific categories of work.
14. As a note-taker, I want to see an active tag filter banner in the Dashboard with a clear `(×)` button, so that I know when a filter is applied and can remove it with one click.
15. As a note-taker, I want tags to save cleanly as standard `#tag` plain text in Markdown files, so that my files remain 100% portable.

### Rich Text Formatting Toolbar & Highlights

16. As a note-taker, I want a visible formatting toolbar at the top of the editor, so that I can easily apply bold, italic, strikethrough, and highlights with single clicks.
17. As a note-taker, I want to highlight text using `==highlighted text==` syntax, so that important points are emphasized with a luminous accent color.
18. As a note-taker, I want keyboard shortcuts `Ctrl+B` (Bold) and `Ctrl+I` (Italic) to toggle formatting on the current selection, matching standard editor expectations.
19. As a note-taker, I want all formatted text to export to clean, standard Markdown constructs without inline HTML `<span style="...">` tags, so that my notes respect ADR-0008.

### Universal Note / Folder Import

20. As a user migrating from other tools, I want the sidebar button to say "Import Note/Folder", so that I know I can bring in individual files as well as entire folders.
21. As a note-taker, I want to import `.txt` files and have them automatically saved as `.md` files in my V-Folder, so that legacy text files are seamlessly integrated.
22. As a note-taker, I want to import `.docx` files and have their headings, paragraphs, and lists converted to clean Markdown notes, so that I don't have to manually reformat Word documents.
23. As a note-taker, I want imported files to be placed in the currently selected folder in my V-Folder, so that my file organization is preserved.

### Sidebar Visual Refresh

24. As a note-taker, I want consistent, crisp icons across the sidebar (using `lucide-react`), so that the interface feels cohesive and premium.
25. As a note-taker, I want folders and notes to have refined spacing, subtle border hierarchy, and clear hover feedback, so that browsing the file tree is pleasant and intuitive.
26. As a note-taker, I want open folders to show an expanded folder icon and active notes to display a distinct highlighted background, so that my active location is obvious.

### Settings Modal, Themes & Live Backgrounds

27. As a note-taker, I want a Settings gear icon at the bottom of the sidebar, so that I can configure app-level preferences without cluttering the main workspace.
28. As a note-taker, I want to choose between multiple Themes (Rosé Pine, Nord, Tokyo Night), so that I can personalize the color palette to my taste.
29. As a note-taker, I want to upload a local image or animated GIF as a Live Background, so that my Vault workspace feels lively and unique.
30. As a note-taker, I want the live background to sit behind translucent frosted-glass panels, so that text remains legible while the backdrop is visible.
31. As a note-taker, I want my selected Theme, Mode, and Live Background preference to persist across app restarts, so that my setup is always preserved.

---

## Implementation Decisions

### TitleBar & Toolbar Polish

- In `NoteActionBar`, remove the `Open` button. Keep `In Progress`, `Blocked`, and `Done`.
- In `TitleBar`, remove the breadcrumb file path text string.
- Relocate the `WORKING / ARCADE` toggle to the left cluster of `TitleBar`, directly adjacent to the `Vault` brand header.

### Keyboard Shortcuts & Quick Switcher

- **Local Hotkeys**: Implemented via a central `useKeyboardShortcuts` hook attached to window `keydown` events. Ignored when typing inside input fields/modals, except editor-specific shortcuts (`Alt+S`, `Ctrl+T`) handled by Lexical plugin commands.
- **Quick Switcher**: A modal overlay component rendered at the root level (`QuickSwitcherModal`). Uses a fuzzy matching algorithm over all file paths in the V-Folder. Supports `↑`, `↓`, `Enter`, `Escape`.
- **Global Shortcuts**: Register `Ctrl+Alt+N` and `Ctrl+Alt+P` using `@tauri-apps/plugin-global-shortcut`. When triggered, invokes window unminimize/focus via Tauri window APIs and dispatches the corresponding action.

### Interactive Tag System

- Use `@lexical/hashtag` / custom `TagNode` with Lexical text matcher for `#([a-zA-Z0-9_\-]+)`.
- Renders as a styled `.vault-tag-pill` span.
- Clicking dispatches an `onSelectTag(tag)` event to `DualColumnLayout`.
- `activeTag` state passed to `TaskDashboardSidebar`. When non-null, renders a dismissible filter chip and filters the tasks list to `task.tags.includes(activeTag)`.

### Rich Text Toolbar & Highlight Extension

- Create `FormattingToolbar` component rendered at the top of `EditorPane`.
- Communicates with Lexical editor instance via `FORMAT_TEXT_COMMAND` (`bold`, `italic`, `strikethrough`).
- Implement `HighlightNode` extending `TextNode` and a custom Markdown transformer rule for `==([^=]+)==` in `checklistTransformer.ts` / markdown export/import pipeline.

### Universal File Importer

- Update `workspaceService` / `fileService` with `importFilesOrFolder(targetDir)`.
- Use Tauri `@tauri-apps/plugin-dialog` to support selecting both files (`.txt`, `.md`, `.docx`) and directories.
- Add `mammoth` parser for `.docx` conversion into clean Markdown string before writing to disk with `.md` extension.
- Plain `.txt` files are read as UTF-8 text and written as `.md`.

### Sidebar Visual Refresh & Settings Modal

- Add `lucide-react` dependency. Replace existing inline SVGs with Lucide components (`Folder`, `FolderOpen`, `FileText`, `Settings`, `Plus`, `Search`, `Upload`).
- Create `SettingsModal` with tabs for `Themes` and `Live Background`.
- `themeService`: Expand CSS variables definition for `nord` and `tokyo-night` themes alongside `rose-pine-moon`.
- Live background: Stores local image path / base64 URL in `localStorage`. Injected as `background-image` on root container with translucent panel overlays (`rgba(...)` and `backdrop-filter: blur(...)`).

---

## Testing Decisions

- **Black-box UI and Behavior Testing**: All tests must exercise observable DOM interactions, shortcuts, and output state, avoiding Lexical private internals.
- **Keyboard Shortcuts**: Simulate `keydown` events for `Ctrl+N`, `Ctrl+P`, `Ctrl+T`, `Alt+S` and assert corresponding state transitions (modal opens, new note created, task status cycles).
- **Tag System**: Render editor with `#urgent` text, assert tag pill is rendered; click tag pill and assert `activeTag` state and filtered task count in sidebar.
- **Rich Text & Highlight Transformer**: Test markdown round-trip for `==highlighted text==` -> Lexical AST -> Markdown export without regressions on checklists or headings.
- **Docx / Txt Importer**: Unit test file conversion helper functions: convert sample `.txt` and `.docx` buffer into expected Markdown strings.
- **Settings Modal & Theme Switching**: Test selecting themes and verify root data attributes or CSS variables update accordingly.

---

## Out of Scope

- Cloud synchronization (deferred to v1.2.0+).
- Arbitrary per-word HTML font colors / font sizes (prohibited by ADR-0008).
- Split View and Graph View (reserved for milestone v1.2.0 / P2).
- Note Cover banners (reserved for future polish).

---

## Further Notes

- Existing 152 unit tests across 17 suites must remain 100% green throughout this milestone.
- All new dependencies (`mammoth`, `lucide-react`, `@tauri-apps/plugin-global-shortcut`) must be vetted and installed cleanly with standard npm scripts.
