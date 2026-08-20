# 02 — Split View Divider Redesign & Ambient Pane Focus

**What to build:** The Split View Divider features a centered tactile grip pill (`⋮⋮`), subtle border lines, smooth drag cursor, and glowing hover transitions (`var(--rose-pink)`). The active pane focus indicator is refined from a rigid 1px full-box outline into an elegant top accent bar and soft ambient glow.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Split View Divider renders with a centered tactile grip handle (`⋮⋮`) and subtle border lines.
- [x] Hovering over the divider triggers a smooth color and glow transition (`var(--rose-pink)`).
- [x] Dragging the divider resizes the dual panes smoothly with clamping (min 20%, max 80%).
- [x] The active/focused pane displays a sleek top accent bar (`border-top: 2px solid var(--rose-pink)`) and soft ambient glow instead of a harsh 1px full-box outline.
- [x] Clicking either pane shifts active focus smoothly without layout jumping.
- [x] Component tests verify divider dragging, grip render, and active pane focus styling.
