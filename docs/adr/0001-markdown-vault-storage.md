# Local Markdown Vault Storage

We have decided to change the fundamental data storage of the checklist app to use a local folder of plain-text Markdown files (a "Vault") instead of a database or browser `localStorage`. Since this is a Tauri desktop app, storing data directly on the file system guarantees users own their data and naturally enables Obsidian-like features such as bidirectional linking.
