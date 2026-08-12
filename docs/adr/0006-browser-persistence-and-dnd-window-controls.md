# 6. Browser Persistence Fallback, Window Control Permissions, and Folder Drag-and-Drop Fixes

Date: 2026-08-11

## Status

Accepted

## Context

When using Vault in non-Tauri browser development environments, files and folders created in memory were lost upon dev server rebuilds or reloads because `mockStorage` reset to default static values. Furthermore, window control buttons (`minimize`, `toggleMaximize`, `close`) in `TitleBar` threw unhandled API exceptions in browser mode and lacked explicit permission declarations in Tauri v2 capabilities (`default.json`). Finally, dragging files into newly created folders in `SidebarTree` showed a prohibition cursor due to missing drag event overrides and `dropEffect` inheritance on tree row elements.

## Decision

1. **LocalStorage Browser Fallback Persistence**:
   - `fileService.ts` maintains `localStorage` synchronization (`vault_mock_storage_files_v1` and `vault_mock_storage_folders_v1`) in browser mode.
   - Any created, updated, renamed, or deleted Notes and Folders are automatically saved to and loaded from `localStorage`, preserving user workspace state across Vite builds and reloads. Native disk operations remain active in Tauri runtime environments.

2. **Explicit Tauri v2 Window Permissions & Browser Guard**:
   - `src-tauri/capabilities/default.json` declares explicit window manipulation permissions (`core:window:allow-minimize`, `core:window:allow-toggle-maximize`, `core:window:allow-maximize`, `core:window:allow-close`).
   - `TitleBar.tsx` checks `isTauriEnvironment()` before dispatching window calls, preventing runtime exceptions in web browsers.

3. **Folder Drag-and-Drop Target Overrides**:
   - `SidebarTree.tsx` attaches `onDragEnter`, `onDragOver`, and `onDrop` handlers with `e.preventDefault()`, `e.stopPropagation()`, and explicit `dropEffect = "move"` on folder tree items, allowing notes to be dropped smoothly into created folders.

4. **Task Drag Handles in Note Editor**:
   - `ChecklistNode.tsx` adds a grip handle icon (`⋮⋮`) and `cursor: grab` cue to task status badges in the note editor, enabling users to drag whole tasks onto target notes in the sidebar.

## Consequences

### Positive

- Persistent note and folder creation across server restarts and hot-module reloads in browser environments.
- Reliable window control functionality in desktop mode and clean fallback in browser mode.
- Smooth drag-and-drop file organization into subfolders without browser target rejection.
- Clear visual drag handle cues on task nodes in note documents.
