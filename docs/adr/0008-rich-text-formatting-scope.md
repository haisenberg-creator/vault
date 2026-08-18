# Rich-text formatting is Markdown-native only in 1.0.0

Vault stores Notes as plain `.md` files. For 1.0.0 we add a formatting toolbar (bold, italic, underline, strikethrough) but only for constructs that map directly to standard Markdown (`**bold**`, `*italic*`, etc.). Per-word font size, font color, and highlight color are deliberately excluded.

## Considered Options

- **Store as inline HTML** (`<span style="color:red">`) — readable by other apps but pollutes plain-text files and breaks the Markdown portability promise.
- **Custom syntax** (e.g. `{color:red}text`) — cleaner but non-standard; third-party renderers won't understand it.
- **Markdown-native only (chosen)** — bold/italic/strike work with every Markdown renderer; files stay fully portable.

## Consequences

Per-word color and font-size are deferred to a future version. If they are added later, a storage format decision will be needed at that point.
