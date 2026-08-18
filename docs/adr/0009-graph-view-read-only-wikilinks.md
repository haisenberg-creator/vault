# Graph View is read-only wikilink visualization, not a mind-map editor

Vault's Graph View renders the wikilink connections between Notes as a static, read-only force-directed graph. Notes and edges cannot be created or rearranged inside the graph — it is a navigation aid, not an authoring surface.

## Considered Options

- **Full mind-map editor** — nodes represent Notes, edges represent wikilinks, both are creatable inside the graph. Very large scope; requires a separate data model.
- **Read-only wikilink graph (chosen)** — derive the graph purely from existing `[[wikilink]]` syntax in Notes; render with a library (e.g. `react-force-graph`). No new data model required.

## Consequences

Users who want to build a graph must do so by writing wikilinks in Notes. The graph is always a derived view, never the source of truth.
