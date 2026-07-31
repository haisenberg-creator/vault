## Destination

A fast, lightweight Desktop app (Tauri + React/Vite) that replaces Notepad++ for managing notes and stateful checklists (open, in progress, blocked, completed) in a single rich document.

## Notes

- Domain: Productivity, Desktop Apps
- Stack: Tauri, Rust, React, Vite
- Preferences: High performance, low resource consumption, rich animated UI but fast startup.

## Decisions so far

- [01-editor-framework](issues/01-editor-framework.md) — Lexical is the chosen rich-text editor framework for best performance and native React decorator support.
- [02-data-storage](issues/02-data-storage.md) — Data will be stored as Plain Markdown files on the user's hard drive, using custom syntax for checklist states.
- [03-scaffold-tauri](issues/03-scaffold-tauri.md) — Scaffolded Tauri + React + TS with Lexical dependencies.
- [04-ui-layout](issues/04-ui-layout.md) — Dual Column layout (Left: Global Task Dashboard, Right: Active Note Editor).
- [05-styling-system](issues/05-styling-system.md) — Animated Rosé Pine Moon Soho Theme with Vanilla CSS tokens, keyframe motion physics, and Pixelify Sans / JetBrains Mono typography.

## Not yet specified

## Out of scope

- Mobile application
- Native desktop frameworks (WPF, Swift, etc. - locked into Tauri)
