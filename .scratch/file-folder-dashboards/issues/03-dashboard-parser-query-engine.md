# 03 — Dashboard Schema Parsing & Task Query Engine

**What to build:** Users can define plain-text `.dashboard.md` files (or `.md` with YAML frontmatter `type: dashboard`) containing multi-section query configurations. The system parses the dashboard schema and aggregates tasks across the Vault, supporting recursive folder scoping (`folder: "Projects"`), state filtering (`open`, `in_progress`, `blocked`, `completed`), tag filtering (`#urgent`), grouping, and sorting options.

**Blocked by:** 01 — Folder Hierarchy & File System Storage Operations

**Status:** done

- [x] `dashboardService` parses YAML frontmatter schema from `.dashboard.md` files into structured section query configurations.
- [x] Task query engine aggregates tasks matching specified state filters, tag filters, and folder path scopes.
- [x] Folder filter recursively includes tasks inside sub-directories by default.
- [x] Support task grouping (by Folder, Note, Tag, State) and sorting options.
- [x] Service unit tests verifying YAML parsing and multi-criteria task query execution across mock vault data.
