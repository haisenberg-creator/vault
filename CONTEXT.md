# Vault

A desktop application (Vault) that manages data using a local file system of plain-text Markdown files (V-Folder), heavily inspired by Obsidian.

## Language

**Vault**:
The desktop application itself.

**V-Folder**:
The root directory on the user's computer containing all their Markdown files and assets opened in Vault.
_Avoid_: Workspace, database, project folder

**Note**:
A single plain-text Markdown file within the Vault.
_Avoid_: Checklist (for the whole file), document, page

**Folder**:
A directory within the Vault used to organize Notes and sub-Folders hierarchically.
_Avoid_: Category, group, directory (when speaking to users)

**Task**:
An actionable item within a Note, represented by a standard Markdown checkbox (`- [ ]`).
_Avoid_: To-do, checklist item, item

**Dashboard**:
A specialized plain-text Markdown file within the Vault configured via YAML frontmatter to aggregate, filter, and render Tasks. The scope of a Dashboard is its containing Folder (and sub-Folders). If placed at the root of the V-Folder, it aggregates Tasks across the entire Vault.
_Avoid_: Report, filter view, query page, widget board

**Dashboard Section**:
A customizable query block or widget inside a Dashboard that filters, groups, and sorts Tasks based on criteria such as State, Tag, and Folder scope.
_Avoid_: Widget, query box, column

**Wikilink**:
A bidirectional link to another Note, enclosed in double brackets (e.g. `[[My Note]]`). Can be placed anywhere, including inside Tasks.
_Avoid_: Internal link, page link, bracket link

**Note Progress**:
A completion percentage reflecting the proportion of completed Tasks versus total Tasks within a specific Note.
_Avoid_: Workspace progress

**Tag**:
A hashtag (e.g. `#urgent`) used to categorize Notes or Tasks, placed directly in the text.
_Avoid_: Label, category

**Priority Header**:
A specific Markdown heading (e.g. `## Urgent`, `## High`, `## Low`) that implicitly assigns a priority level to all Tasks physically located beneath it, until the next heading.
_Avoid_: Priority tag, priority block

**Arcade Mode**:
A visual theme mode featuring pixel/arcade typography (`Pixelify Sans`), retro styling, and Minecraft-inspired icon accents (Enchanted Book).

**Working Mode**:
The default visual theme mode featuring clean modern typography (`Plus Jakarta Sans` and `JetBrains Mono`) and standard interface icons (Normal Book).
