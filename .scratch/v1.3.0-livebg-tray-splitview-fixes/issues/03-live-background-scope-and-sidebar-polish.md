# 03 — Live Background Scope & Sidebar Glassmorphic Polish

**What to build:** Adds a **Live Background Scope** setting in Settings Modal allowing users to toggle between **"Full App"** (global backdrop with frosted glass panels across all panes) and **"Sidebar Only"** (live background rendered exclusively in the Sidebar, keeping the editor pane solid). Upgrades the Sidebar with modern frosted glassmorphism, gradient accent borders on hover/active states, active note ambient glow (`box-shadow: 0 0 12px var(--rose-pink-glow)`), and smooth micro-transitions.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Settings Modal contains a "Live Background Scope" toggle with options "Full App" and "Sidebar Only".
- [x] When "Sidebar Only" is selected, the Live Background image/GIF is rendered exclusively inside the Sidebar container with configured opacity and blur, while the Editor pane remains solid `var(--rose-bg-base)`.
- [x] When "Full App" is selected, the Live Background sits behind the entire window with frosted translucent panels across all panes.
- [x] The Sidebar navigation drawer features modern frosted glassmorphism (`backdrop-filter: blur(16px)`).
- [x] Currently active note row in the file tree features an ambient glow (`box-shadow: 0 0 12px var(--rose-pink-glow)`) and gradient border highlight.
- [x] Hover and active transitions on file tree rows and dashboard section headers are smooth and tactile.
- [x] Unit and component tests verify scope switching, class toggling, and local storage persistence.
