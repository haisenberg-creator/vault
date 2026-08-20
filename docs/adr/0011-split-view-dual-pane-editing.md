# Split View dual-pane independent note editing

Vault supports side-by-side editing of two Notes (or Dashboards) within a single window, enabling comparative reference and simultaneous task management.

## Considered Options

- **Read-only preview secondary pane** — The right pane only displays rendered HTML markdown or graph view. Limits workflows where users want to edit two notes at once.
- **Fixed 50/50 split** — Does not allow adjusting editor widths for different screen sizes or notes.
- **Independent dual-pane editor with draggable divider (chosen)** — Left and Right panes maintain independent active note state, Lexical editor instances, and scroll positions. An active pane focus model routes sidebar / Quick Switcher selections to the currently focused pane.

## Consequences

- Users can open any Note or Dashboard in either pane via the ActionBar "Split Right" button, context menu, or `Ctrl+\`.
- Closing a pane smoothly collapses the layout back to single-pane view without losing unsaved changes.
