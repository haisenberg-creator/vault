# 3. Multi-Section Dashboard Layout & Recursive Folder Scoping

Date: 2026-08-10

## Status

Accepted

## Context

We needed to define how custom Task Dashboards query and render tasks from across the Vault, how folder hierarchy affects query scoping, and how users interact with Dashboards.

## Decision

1. **Dashboard Definition**: Dashboards use YAML frontmatter to define one or more **Dashboard Sections** with state, tag, and folder filter criteria, as well as grouping and sorting options.
2. **Recursive Folder Scoping**: By default, folder queries (`folder: "Projects"`) recursively match tasks in sub-folders (`Projects/Sub/`).
3. **Interactive View**: Opening a Dashboard renders a rich interactive UI with real-time checkbox toggling, navigation links to source Notes, and a toggle to view/edit raw YAML source.
4. **Unified Sidebar**: Folders, Notes, and Dashboards are presented in a unified tree structure with distinct icons, quick-access Dashboard pinning, and file operations (create, rename, delete, move).

## Consequences

### Positive

- Flexible and powerful task organization without proprietary databases.
- Seamless editing of task states directly from high-level dashboards.
- Clean file tree navigation matching file system organization.

### Negative

- Requires robust frontmatter parsing and file watching to sync changes across opened views.
