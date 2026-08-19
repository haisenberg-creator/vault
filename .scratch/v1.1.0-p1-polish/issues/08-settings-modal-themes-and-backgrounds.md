# 08 — Settings Modal, Themes & Live Backgrounds

**What to build:** Add a Settings gear ⚙️ icon at the bottom of the sidebar that opens a Settings modal. Provide a "Themes" tab allowing users to choose between color palettes (Rosé Pine, Nord, Tokyo Night) and a "Backgrounds" tab allowing users to load a local image or animated GIF as a Live Background rendered behind translucent app panels. Persist settings across sessions in localStorage.

**Blocked by:** 06 — Sidebar Visual Refresh with Lucide Icons

**Status:** ready-for-agent

- [ ] A Settings gear icon is visible at the bottom of the sidebar, opening the Settings modal on click
- [ ] Settings modal has tabs for "Themes" and "Live Background"
- [ ] Selecting a Theme (Rosé Pine, Nord, Tokyo Night) updates the global CSS variable palette immediately
- [ ] Selecting a Live Background allows choosing a local image/GIF, rendering it as the fixed backdrop behind translucent glass panels
- [ ] Selected Theme and Live Background settings persist across app restarts
- [ ] Escape key and outside clicks dismiss the Settings modal cleanly
- [ ] Automated tests verify theme switching, background state persistence, and modal lifecycle
