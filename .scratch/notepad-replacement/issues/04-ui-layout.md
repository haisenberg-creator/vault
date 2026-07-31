Status: resolved
Type: grilling

## Question

What should the UI/UX layout of the desktop app look like?

Options:

1. **Notepad++ style:** Multi-tab layout with a collapsible sidebar showing a workspace file tree.
2. **Zen Mode / Single Document:** Ultra-minimalist interface with just a single active note and a switcher modal/palette (like Raycast or VSCode Command Palette).

## Answer

We will use **Variant C (Dual Column: Task Dashboard + Note Editor)**. The left column acts as a live global task dashboard aggregating all stateful checklist items (`Blocked`, `In Progress`, `Open`, `Completed`) across all notes in the workspace, while the right column acts as the active document editor. Tested and confirmed via UI prototype.
