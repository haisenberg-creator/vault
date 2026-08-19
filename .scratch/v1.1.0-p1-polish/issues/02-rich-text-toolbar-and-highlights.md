# 02 — Rich Text Formatting Toolbar & Highlight Extension

**What to build:** Add a fixed formatting toolbar at the top of the editor pane with buttons for Bold (`**text**`), Italic (`*text*`), Strikethrough (`~~text~~`), and Highlight (`==text==`). Implement custom Lexical Highlight node and markdown transformer that round-trips `==highlighted text==` cleanly without injecting inline HTML tags, strictly adhering to ADR-0008.

**Blocked by:** None — can start immediately

**Status:** closed

- [x] A fixed formatting toolbar renders above the Lexical editor with Bold, Italic, Strikethrough, and Highlight buttons
- [x] Clicking Bold, Italic, or Strikethrough toggles the respective formatting on the active selection
- [x] Keyboard shortcuts `Ctrl+B` and `Ctrl+I` toggle Bold and Italic formatting
- [x] Clicking Highlight wraps the selected text in `==highlight==` and renders it with a luminous accent background in the editor
- [x] Highlighting round-trips between Markdown text and Lexical editor without HTML tags (`<span style="...">`)
- [x] Existing task checkboxes, priority headers, and markdown import/export continue to function without regression
- [x] Automated tests verify formatting actions and markdown highlight round-tripping
