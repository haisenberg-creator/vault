# 03 — Interactive Tag System & Dashboard Filtering

**What to build:** Parse `#hashtags` in the Lexical editor into interactive, styled clickable pills. When a user clicks a tag pill in the editor or sidebar, apply an active tag filter to the Task Dashboard that scopes visible tasks to only those containing the selected `#tag`, and render a dismissible "Filtered by #tag" banner with a clear `(×)` button.

**Blocked by:** None — can start immediately

**Status:** closed

- [x] Hashtags (e.g. `#urgent`, `#project-x`) typed into notes are automatically parsed and rendered as styled clickable pills in the editor
- [x] Tags save and export cleanly as standard `#tag` plain text in Markdown files
- [x] Clicking any tag pill sets the active tag filter in the app state
- [x] When a tag filter is active, the Task Dashboard displays an active filter banner showing `#tag` and a clear `(×)` button
- [x] When a tag filter is active, only tasks containing that specific `#tag` are displayed in the Dashboard
- [x] Clicking the `(×)` button on the filter banner clears the filter and restores all tasks
- [x] Automated tests verify hashtag parsing, click-to-filter propagation, and dashboard task filtering
