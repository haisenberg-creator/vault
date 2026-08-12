## Problem Statement

The user is experiencing several usability bugs and missing convenience features related to task management, drag-and-drop interactions, and initial state within the Vault application. Specifically:

1. Creating a new task from the toolbar doesn't focus the editor on the new task line.
2. Hitting `Enter` on a task line creates a standard bullet point instead of continuing the task list, forcing manual interaction.
3. When a note is placed inside a subfolder, the Task Dashboard fails to open the note correctly, treating it as a new empty file and failing to track its task progress.
4. The task status toolbar buttons are cluttered with raw markdown syntax brackets (e.g. `[ ] Open`).
5. Dragging a note in the sidebar over folder boundaries causes a rapid, infinite visual flickering loop.
6. Dragging a task from the active note into another note occasionally duplicates the task because the removal from the active note fails to synchronize with the editor's internal state.
7. The application defaults to opening the "Tasks" tab on startup, but the user prefers it to open the "Files & Folders" tab.

## Solution

We will implement a suite of targeted fixes across the UI components and state logic to create a seamless user experience:

1. Intercept Lexical editor commands to automatically focus the newly inserted task when created via the toolbar, and to continue the task list automatically when `Enter` is pressed.
2. Update the path normalization and matching logic in the layout component so it correctly resolves and loads existing files inside subfolders, restoring their task tracking capabilities.
3. Refine the toolbar UI to remove markdown brackets from the button labels.
4. Fix the drag-and-drop indicator styles in the sidebar to prevent layout shifting and hover flickering.
5. Ensure the task removal logic properly triggers a state update in the active editor so that moved tasks are reliably deleted from the source document.
6. Change the default startup tab state to "files".

## User Stories

1. As a user, I want the editor to automatically focus on the new task I just created from the toolbar, so that I can immediately start typing without clicking again.
2. As a user, I want pressing `Enter` on a task to automatically create a new task on the next line, so that I can rapidly type out a checklist.
3. As a user, I want pressing `Enter` on an empty task to exit the task list, so that I don't have to manually delete the empty checkbox when I'm done.
4. As a user, I want the Task Dashboard to correctly open notes that are located inside folders, so that I can manage tasks across my entire workspace hierarchy.
5. As a user, I want the progress of tasks inside subfolders to be calculated correctly, so I can trust the dashboard statistics.
6. As a user, I want the task status buttons in the toolbar to have clean labels without markdown brackets, so that the UI looks polished and readable.
7. As a user, I want to drag notes over folders without the UI flickering wildly, so that organizing my workspace feels stable and predictable.
8. As a user, I want tasks that I drag to another note to be reliably removed from the original note, so that I don't end up with duplicate tasks.
9. As a user, I want the application to start on the "Files & Folders" tab, so that I can immediately see my workspace structure instead of my tasks.

## Implementation Decisions

- **Editor Commands**: We will utilize Lexical's internal state updates (`editor.update()`) and node selection APIs to manage focus and intercept the `Enter` key behavior for task nodes, ensuring the markdown source-of-truth remains in sync.
- **Path Resolution**: We will harden the `activeFileObj` matching logic in the Dual Column Layout to correctly compare relative paths containing slashes (e.g., `Projects/Note.md`), ensuring the editor component receives the existing file content instead of a blank template.
- **Task Deletion Sync**: We will modify the `removeTaskFnRef` implementation provided by the editor to ensure it physically deletes the task node from the Lexical AST, preventing the editor from re-saving stale content over the file system updates.
- **Visual Drag Indicators**: We will adjust the sidebar tree's CSS to use `box-sizing: border-box` with inset borders or absolute-positioned overlays for the `isOver` drag state, guaranteeing the element's physical height remains constant and eliminating the hover oscillation bug.
- **Tab State**: We will modify the `initialTab` default prop of the sidebar component.

## Testing Decisions

- **React Component Seams**: We will test the task insertion and `Enter` key behaviors by mocking the Lexical editor context within the `EditorPane` component tests.
- We will test the path resolution and task duplication fixes by mounting `DualColumnLayout` with a mocked file system (via `mockStorage`), simulating drag-and-drop events and asserting the correct `readMarkdownFile` and `writeMarkdownFile` operations.
- The button label changes will be verified with a simple React Testing Library render test on `NoteActionBar`.
- **Manual Verification**: Due to the historical brittleness of testing drag-and-drop hover CSS layout quirks in JSDOM, the sidebar flickering bug will be verified manually.

## Out of Scope

- Refactoring the entire Lexical markdown parser.
- Implementing drag-and-drop for tasks inside the editor itself (only sidebar-to-note and note-to-sidebar drag-and-drop are in scope).

## Further Notes

Status: ready-for-agent
