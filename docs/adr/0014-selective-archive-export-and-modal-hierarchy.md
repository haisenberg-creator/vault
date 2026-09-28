# Selective Archive Export and Modal Hierarchy

## Context and Problem Statement

ADR 0010 introduced `.zip` Vault Archives as a way to export and import notes for offline backup and synchronization. However, the export action was an all-or-nothing command: clicking "Export Vault Archive" immediately compressed the entire V-Folder.

Users require the ability to export a specific folder, project, or curated subset of notes without being forced to manually edit `.zip` files in their operating system.

## Considered Options

- **Option A: Blind All-or-Nothing Export Only** — Retain the single-click full export. Rejected because users frequently need to share or back up single sub-folders or selected notes.
- **Option B: Flat Filterable Checklist Modal** — Display a flat search list of all notes with checkboxes. Rejected because it discards folder context and makes bulk-selecting an entire directory tedious.
- **Option C: Interactive Hierarchical Tree with Tri-State Checkboxes and "Select All" Toggle (Chosen)** — Display the complete V-Folder hierarchy in an interactive modal. Checking a folder recursively selects all child notes and sub-folders; partial selections reflect an indeterminate (`-`) state on parent folders. Provide a master "Select All / Deselect All" toggle and a live selection counter.

## Consequences

- **User Control**: Users can export full vaults or targeted sub-trees with equal ease.
- **File Inclusions**: Preserves relative directory paths from the V-Folder root and packages both standard `.md` notes and `.dashboard.md` task dashboards into the exported archive.
- **Backwards Compatibility**: The existing import resolution strategies (Merge / Replace) from ADR 0010 remain fully compatible with archives exported selectively.
