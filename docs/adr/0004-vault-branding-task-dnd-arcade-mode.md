# 4. Vault Application Naming, Cross-Note Task Drag-and-Drop, Note Action Toolbar & Arcade Mode

Date: 2026-08-11

## Status

Accepted

## Context

The application needed a clear brand identity ("Vault"), improved task manipulation capabilities across notes, enhanced list/task styling controls in the note editor, and a toggleable retro arcade aesthetic mode alongside standard working typography.

## Decision

1. **Branding & Ubiquitous Language**:
   - The application is officially named **Vault**.
   - The root storage directory opened inside Vault is named **V-Folder** (updating `CONTEXT.md`).
2. **Cross-Note Task Drag-and-Drop**:
   - Dragging a task from the editor or task dashboard and dropping it onto a destination Note in the sidebar file tree **moves and appends** the task line to the target Note (removing it from source note).
3. **Note Action Control Bar**:
   - Above the note title/content in `EditorPane`, an interactive toolbar offers:
     - `+ New Task` quick creation.
     - Task state picker (`[ ]`, `[-]`, `[>]`, `[x]`).
     - Expanded List Marker / Style Picker (`[ ]`, `[x]`, `[-]`, `[>]`, `-`, `+`, `*`, `•`, `◦`, `▪`, `→`, `★`, `1.`).
4. **Theme & Arcade Mode**:
   - Sidebar header includes a toggle button next to "Task Dashboard" switching between **WORKING** mode (Normal Book icon, clean modern typography) and **ARCADE** mode (Minecraft Enchanted Book icon, pixel typography via `Pixelify Sans`, glowing retro styling).
   - Theme choice persists in `localStorage`.
5. **App Branding Icon**:
   - Updated app icon to a Minecraft Lectern asset.

## Consequences

### Positive

- Clear separation of app identity vs. storage directory in domain vocabulary.
- Intuitive drag-and-drop workflow for organizing tasks across notes.
- Rich control over task list syntax without needing to memorize Markdown shortcuts.
- Delightful theme toggle blending productivity and retro gaming aesthetic.

### Negative

- Cross-note task drag operations require atomic reads and writes across multiple Markdown files.
