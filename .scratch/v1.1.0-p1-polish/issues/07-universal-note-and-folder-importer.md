# 07 — Universal Note & Folder Importer

**What to build:** Update the sidebar import action to "Import Note/Folder". Allow users to import an entire folder or individual files (`.md`, `.txt`, `.docx`). Plain text files (`.txt`, `.md`) are written directly to the active folder as Markdown notes, and Word documents (`.docx`) are parsed via `mammoth.js` and converted into clean Markdown notes preserving headings, paragraphs, and lists.

**Blocked by:** 06 — Sidebar Visual Refresh with Lucide Icons

**Status:** ready-for-agent

- [ ] Sidebar button label and tooltip read "Import Note/Folder"
- [ ] File dialog allows selecting folders or individual files (`.md`, `.txt`, `.docx`, and other text formats)
- [ ] Importing `.md` or `.txt` creates a corresponding `.md` Note in the selected target folder
- [ ] Importing `.docx` uses `mammoth` to convert document contents into clean Markdown and writes the resulting `.md` file
- [ ] File tree automatically refreshes to display newly imported files immediately
- [ ] Automated tests verify file conversion pipeline and directory insertion
