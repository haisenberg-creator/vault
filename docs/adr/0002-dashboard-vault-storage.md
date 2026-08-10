# 2. Store Dashboard Definitions as Markdown Files in Vault

Date: 2026-08-07

## Status

Accepted

## Context

Users require the ability to create, save, and switch between custom Task Dashboards (e.g. filtering tasks by tag, status, folder, or due date). We needed to decide where dashboard definitions and layout configurations are stored.

## Decision

We will store Task Dashboard configurations as specialized Markdown files (`.dashboard.md` or `.md` files with YAML frontmatter `type: dashboard`) directly inside the user's Vault.

## Consequences

### Positive

- **Portability & Version Control**: Dashboards live within the Vault folder structure and can be committed to Git, backed up, or shared alongside notes.
- **Consistency**: Follows the core architectural principle that all user data and views in the app are plain-text files stored in the Vault.

### Negative

- **File System Clutter**: Dashboard files appear alongside normal Notes in the file system, requiring sidebar filtering or visual indicators to distinguish them from standard Notes.
- **Parsing Overhead**: Requires parsing YAML frontmatter when loading dashboard files.
