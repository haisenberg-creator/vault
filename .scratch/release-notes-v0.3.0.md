# Vault v0.3.0 Release Notes

## Highlights & Features ✨

### 📝 Editor List Ergonomics & Custom Markers

- **Custom Unordered List Markers**: Support for extended bullet markers (`-`, `*`, `+`, `•`, `◦`, `▪`, `→`, `★`) with attribute persistence via custom Lexical list nodes.
- **Smart Task Indentation on Enter**: Pressing Enter on a checklist item maintains list indentation level, while pressing Enter on an empty task escapes the list into a regular paragraph.
- **Arrow Transformation**: Automatic bidirectional text transformer converting `=>` to `⇒` and preserving markdown syntax.

### 📁 Sidebar & Folder Import

- **Folder Import with Text Conversion**: Ability to import folders directly via folder picker, automatically converting `.txt` files to `.md` notes.
- **Drag Constraints**: Completed checklist items are restricted from being dragged to prevent accidental reordering.

### 📖 Documentation & Setup

- Added interactive setup bootstrap script documentation in `SETUP.md`.
- Configured recommended VSCode workspace extensions.
