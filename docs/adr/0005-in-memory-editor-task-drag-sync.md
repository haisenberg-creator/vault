# 5. In-Memory Editor Synchronization & File Tree Target Scoping for Task Drag-and-Drop

Date: 2026-08-11

## Status

Accepted

## Context

When moving a task from an active note via drag-and-drop or modal move actions, previous file operations updated the target file and source file on disk, but did not update the open Lexical editor instance in `EditorPane`. As a result, `TaskExtractorPlugin` continued to report the moved task in `activeEditorTasks`, keeping the task in the Task Dashboard sidebar. Subsequent editor saves also risk overwriting the disk file with stale editor content. Additionally, dragging task items onto non-markdown nodes in the file tree needed strict target scoping.

## Decision

1. **In-Memory Lexical AST & Active Task Removal**:
   - When a task is moved out of the active note (via sidebar tree drop or task move action), the active Lexical editor AST is updated in-memory to remove the target task node/line.
   - Removing the node triggers Lexical's internal update listeners, updating `activeEditorTasks` and saving the clean note to disk via `MarkdownSyncPlugin`.
2. **Task State Preservation**:
   - Tasks moved between notes retain their exact markdown status line (e.g. `- [x] Completed Task` or `[-] In Progress Task`) in the target note.
3. **Drag-and-Drop Source Metadata & Target Scoping**:
   - `ChecklistNode` includes the active note filename in the `dataTransfer` JSON payload under `sourceFile`.
   - `SidebarTree` restricts task drop targets exclusively to valid Markdown file nodes (`.md`), highlighting drag targets with a dashed outline only on `.md` files.

## Consequences

### Positive

- Immediate, zero-flicker UI reactivity: moved tasks disappear instantly from both the note editor and the Task Dashboard.
- Prevents disk file corruption or task resurrection from stale editor auto-saves.
- Task status history is preserved across cross-note moves.
- Explicit visual feedback when dropping tasks onto valid file nodes in the sidebar.

### Negative

- Requires callback registration between `EditorPane` and `DualColumnLayout` to expose AST node removal methods.
