# 01: Domain Docs and Quantitative Performance Invariants

**What to build:** Formally update `CONTEXT.md` with quantitative performance budgets and new domain glossary terms, and record architectural decision records (ADRs) for the v2.0.0 architecture.

**Blocked by:** None (can start immediately)

**Required skills:** `domain-modeling`, `writing-for-agents`

**Status:** resolved

- [x] Add explicit quantitative constraints to `CONTEXT.md` under Core Principles (idle RAM < 120MB, production frontend bundle < 2MB, strictly zero external background daemons or database engines, lazy-loaded file trees scaling beyond 10,000 notes, 100% plain-text file storage).
- [x] Add the canonical definition of `Mind Map View` to `CONTEXT.md` as a localized, heading-derived visual tree outline, distinct from the wikilink `Graph View`.
- [x] Add the canonical definition of `Workspace Session` to `CONTEXT.md` defining the transient UI layout state saved and restored across app restarts.
- [x] Create `docs/adr/0013-note-outline-mind-map-view.md` documenting the decision to use a lightweight, zero-dependency SVG heading tree rather than a heavy third-party canvas engine.
- [x] Create `docs/adr/0014-selective-archive-export-and-modal-hierarchy.md` documenting the tri-state hierarchical modal with "Select All" toggle over flat lists.
- [x] Create `docs/adr/0015-workspace-session-persistence-and-sidebar-ergonomics.md` documenting `localStorage` UI state caching and 0px Zen collapse ergonomics.
