---
name: graphify
description: Build, query, and inspect the codebase AST and dependency knowledge graph. Use when navigating complex module relationships, checking component dependencies, or preparing architecture maps for the upcoming in-app Graph View.
---

# Graphify — Codebase Knowledge Graph & AST Indexing

`graphify` indexes TypeScript/React and Rust source files across the Vault repository, mapping imports, exports, components, services, hooks, types, and Tauri IPC commands into a unified knowledge graph.

## When to Use

- **Understanding module coupling**: Discover which components or services import a specific module before refactoring.
- **Architectural reviews**: Inspect dependency direction, detect cyclic references, or find orphaned modules.
- **AI navigation**: Quickly find all exports, dependents, and dependencies of a subsystem without manual ripgrep sweeps.
- **v2.0.0 Graph View roadmap**: Provides the underlying graph data structure and layout model for the upcoming in-app Note & Task Graph View.

## CLI Usage

### Generate Graph & View Stats

```bash
npm run graphify -- --stats
```

Output:

```
=== Vault Codebase Knowledge Graph ===
Total Files:   60
Total Edges:   102
Components:    37
Services:      10
Hooks:         2
Types:         2
Rust Modules:  2
======================================
```

### Query Specific Modules

```bash
# Query all modules matching "theme"
node scripts/graphify.js --query theme

# Query all modules matching "editor"
node scripts/graphify.js --query editor

# Query Tauri backend modules
node scripts/graphify.js --query rust
```

### Custom Output Location

```bash
node scripts/graphify.js --output .scratch/graphify-custom.json
```

## Schema Reference

The generated `graphify.json` has the following schema:

```json
{
  "generatedAt": "2026-08-20T09:47:16.184Z",
  "stats": {
    "totalFiles": 60,
    "totalEdges": 102,
    "components": 37,
    "services": 10,
    "hooks": 2,
    "types": 2,
    "rustCommands": 2
  },
  "nodes": {
    "src/services/themeService.ts": {
      "id": "src/services/themeService.ts",
      "name": "themeService",
      "type": "service",
      "path": "src/services/themeService.ts",
      "imports": [],
      "exports": ["ThemeMode", "LiveBackgroundScope", "getThemePalette", "setThemePalette", ...],
      "dependencies": [],
      "dependents": [
        "src/components/layout/DualColumnLayout.tsx",
        "src/components/settings/SettingsModal.tsx",
        "src/components/sidebar/TaskDashboardSidebar.tsx"
      ],
      "loc": 204
    }
  }
}
```

## Graph View v2.0.0 Bridge

The output of `graphify` serves as the testbed and seed data for the interactive Force-Directed / Canvas Graph View planned for Vault v2.0.0, allowing visualization of both codebase structure and Obsidian-style note/wikilink networks.
