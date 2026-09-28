# Note Outline Mind Map View Architecture

## Context and Problem Statement

In Vault v2.0.0, users need spatial visualization and bird's-eye outline navigation when working with complex, heavily structured notes containing multiple heading levels (`#`, `##`, `###`).

ADR 0009 explicitly established that the **Graph View** is a read-only force-directed visualizer derived strictly from `[[wikilinks]]` between separate Notes. Users often ask for "mind mapping", but introducing a full, freeform graph canvas with drag-and-drop node creation would require a complex external data model, heavy canvas libraries (e.g. Cytoscape, Mermaid runtime, or D3-force), and substantial memory overhead, violating Vault's core principle of high performance and low resource consumption.

## Considered Options

- **Option A: Full-Canvas Freeform Graph Editor** — Introduce a separate `.canvas` or node-edge data model with bidirectional linking and freehand positioning. Rejected due to high dependency bloat (> 300KB runtime), large RAM overhead, and divergence from plain-text Markdown as the single source of truth.
- **Option B: Interactive Wikilink Graph View** — Overturn ADR 0009 to allow creating Notes and drawing links on the existing Graph View. Rejected because it introduces file creation side-effects from a visualization canvas and does not assist intra-note structural navigation.
- **Option C: Localized Heading-Derived Note Outline Mind Map (Chosen)** — Dynamically parse heading lines (`#`, `##`, `###`, `####`) from the active note's Markdown AST into a hierarchical tree. Render the tree using zero-dependency, lightweight reactive SVG with organic connector curves. Clicking any node smoothly scrolls the Lexical editor to that section.

## Consequences

- **Performance**: Zero external canvas library dependencies; SVG tree bundle footprint is $< 15$KB with negligible memory usage.
- **Data Model**: No separate data model or proprietary file syntax; the Markdown headings in the note remain the single source of truth.
- **Ergonomics**: Toggled conveniently from the Note Action Bar beside the editor, providing instant spatial navigation without leaving the note.
