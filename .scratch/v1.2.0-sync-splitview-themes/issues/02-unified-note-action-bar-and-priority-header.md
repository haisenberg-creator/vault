# 02 — Unified Note Action Bar & Priority Header Formatting

**What to build:** Consolidate the editor toolbar into a single compact, tactile row at the top of the note editor. Priority controls must be formatted with a clean uppercase text label `PRIORITY:` followed by `[Urgent]`, `[High]`, and `[Low]` badge buttons matching `STATUS:`. Text formatting controls (`B`, `I`, `S`, `==HL==`) must be placed directly in the main action bar, eliminating duplicate/stacked secondary toolbars.

**Blocked by:** None — can start immediately.

**Status:** Done

- [x] Note editor toolbar is rendered as a single unified action bar containing Task actions, Priority, Status, Text Formatting, and Marker style picker.
- [x] Priority controls display a clean `PRIORITY:` label and insert `# Urgent`, `## High`, `## Low` markdown headers.
- [x] Formatting buttons (`B`, `I`, `S`, `==HL==`) trigger bold, italic, strikethrough, and highlight formatting on current text selection with active state indicators.
- [x] Secondary stacked formatting toolbar is eliminated to maximize vertical writing space.
- [x] Automated tests in `NoteActionBar.test.tsx` and `EditorPane.test.tsx` pass.
