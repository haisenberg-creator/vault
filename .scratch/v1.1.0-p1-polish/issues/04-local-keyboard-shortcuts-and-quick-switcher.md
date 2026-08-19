# 04 — Local Keyboard Shortcuts & Quick Switcher

**What to build:** Implement local app-level keyboard shortcuts for rapid editing and navigation: `Ctrl+N` to create a new Note, `Ctrl+T` to insert a new Task at cursor, `Alt+S` to cycle the focused task's status (`Open → In Progress → Blocked → Done → Open`), and `Ctrl+P` to open the Quick Switcher command palette overlay with fuzzy search across all V-Folder notes.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Pressing `Ctrl+N` inside Vault creates a new Note in the active folder and opens it for editing
- [ ] Pressing `Ctrl+T` while editing a Note inserts a new Task checkbox at cursor
- [ ] Pressing `Alt+S` while focused on a Task line cycles its status through `Open → In Progress → Blocked → Done → Open`
- [ ] Pressing `Ctrl+P` opens the Quick Switcher command-palette modal
- [ ] Quick Switcher supports fuzzy filtering over all Notes in the V-Folder
- [ ] Quick Switcher results can be navigated with `↑ / ↓` and selected with `Enter` (or dismissed with `Escape`)
- [ ] Shortcuts do not interfere with standard text typing inside inputs/editor
- [ ] Automated tests verify all shortcuts and Quick Switcher fuzzy navigation
