Status: ready-for-agent

## Problem Statement

The Vault desktop application currently suffers from several UI, UX, and functional inconsistencies related to task ergonomics, Markdown processing, and sidebar behaviors:

1. Newly created tasks in the Lexical editor have a misaligned left margin compared to parsed tasks.
2. The Tasks Dashboard tab opens notes using a relative path instead of an absolute path, causing the editor to load an empty/new state rather than the actual note.
3. Markdown list bullet markers (`*`, `+`, `-`) selected via the dropdown render as generic dots instead of their specified characters.
4. Users cannot import external folders or bulk-convert text files into the Vault.
5. Priority headings (`## Urgent`, etc.) lack visual distinction.
6. Users cannot drag and drop tasks under specific Priority headings within the editor to change their priority.
7. Creating Priority headings currently requires manual typing; there are no quick-access toolbar buttons.
8. In "Working Mode", ordered list numbers (`1.`, `2.`) are pushed too far to the left, causing them to be partially cut off.
9. Vietnamese text is aggressively flagged with red squiggles by the browser's native spell checker inside the editor.
10. The Lexical auto-transformer for `=>` is buggy; typing additional characters after the arrow eventually causes the `=` to disappear, leaving a broken `>`.

## Solution

We will resolve these issues through a comprehensive update targeting the Lexical configuration, the Sidebar layout, native Tauri dialog integrations, and Markdown transformers:

- **Editor Ergonomics:** Fix CSS alignment for tasks and ordered lists, apply explicit list-style rendering for bullet markers, and disable native spellchecking.
- **Priority System:** Color-code Priority Headers, add 3 quick-insert toolbar buttons (Urgent, High, Low), and enable drag-and-drop of tasks under these headers.
- **Path Resolution:** Update the Tasks Dashboard to resolve and open notes using absolute paths.
- **Import Functionality:** Add an "Import Folder" feature via a native file picker that copies folders into the Vault and auto-converts `.txt` files to `.md`.
- **Markdown Transformers:** Implement a custom `TextMatchTransformer` for `=>` that cleanly converts it to `⇒` without eating adjacent characters during subsequent typing.

## User Stories

1. As a user, I want newly created tasks to align perfectly with existing tasks, so that my notes look visually consistent.
2. As a user, I want clicking a note in the Tasks tab to open the actual note, so that I don't accidentally create a duplicate empty note.
3. As a user, I want list bullet markers (*, +, -) to render as their specific characters, so that I can visually distinguish list types.
4. As a user, I want to import a folder from my computer into the Vault, so that I can easily migrate external data.
5. As a user, I want imported `.txt` files to automatically convert to `.md`, so that they are instantly compatible with the Vault editor.
6. As a user, I want Priority Headers (Urgent, High, Low) to have distinct colors, so that I can quickly visually scan for important sections.
7. As a user, I want 3 Priority buttons in the toolbar, so that I can insert priority headers with a single click instead of typing Markdown.
8. As a user, I want to drag and drop a task under a Priority Header, so that I can quickly change its priority level without copy-pasting.
9. As a user, I want ordered list numbers in Working Mode to be fully visible, so that I can read the sequence clearly.
10. As a user, I want to type Vietnamese text without red squiggles, so that the editor doesn't feel cluttered with false spelling errors.
11. As a user, I want to type `=>` and have it securely convert to an arrow (`⇒`), so that typing numbers or text immediately afterward doesn't break the symbol and delete the `=`.

## Implementation Decisions

- **Lexical Editor Configuration:** We will set `spellCheck={false}` on the Lexical `ContentEditable` component.
- **Priority System:** We will add 3 toolbar buttons that dispatch commands to inject `HeadingNode`s with specific priority text. We will use CSS (either targeting specific heading nodes or using generic text-matching CSS if supported, or extending `HeadingNode` themes) to color the headers. Drag-and-drop node reordering will be enabled for tasks to move them between header sections.
- **Arrow Transformation:** We will remove the default `=>` TextMatchTransformer from Lexical's `TRANSFORMERS` array and replace it with a custom transformer that explicitly preserves surrounding text nodes.
- **Sidebar Pathing:** The `openNote` function handler in `TaskDashboardSidebar` will be updated to pass the absolute file path, mirroring the behavior of the Files & Folders tab, while the UI will continue to display the clean relative path.
- **Folder Import:** We will use `@tauri-apps/api/dialog` to trigger a native folder picker, followed by a recursive file copy operation that intercepts `.txt` extensions and writes them as `.md`.
- **CSS Adjustments:** We will update `index.css` to fix the `TaskNode` padding, `ol` margins in Working Mode, and `ul` list-style-types for custom markers.

## Testing Decisions

- **What makes a good test:** Tests should verify the external behavior (e.g., text conversion output, file path resolution) without tightly coupling to the Lexical DOM structure where possible.
- **Modules to be tested:**
  - `workspaceService.ts`: Test the `importFolder` logic (mocking the FS) to ensure `.txt` files are renamed to `.md` during the copy.
  - `checklistTransformer.ts`: Unit test the custom `=>` transformer to ensure that appending characters (like `7` then `8`) doesn't cause the preceding text node to drop characters.
  - `TaskDashboardSidebar` / `EditorPane`: Component-level tests to verify that the absolute path is correctly passed to the editor when a note is clicked in the Tasks tab, and that Priority buttons dispatch the correct Lexical events.
- **Prior art:** We will follow the existing pattern in `workspaceService.test.ts` for file operations and `@testing-library/react` patterns in `TaskDashboardSidebar.test.tsx`.

## Out of Scope

- Synchronizing imported folders with their original source (this is a one-time import copy).
- Advanced spellchecking dictionaries (we are simply disabling the native one).
- Complex drag-and-drop between completely different notes (drag-and-drop priority is constrained to within the single active editor).

## Further Notes

- The fix for the `=>` transformer is specifically addressing a bug where typing a sequence of characters quickly after the transformation causes a DOM reconciliation issue that drops the `=` character from the previous text node.
