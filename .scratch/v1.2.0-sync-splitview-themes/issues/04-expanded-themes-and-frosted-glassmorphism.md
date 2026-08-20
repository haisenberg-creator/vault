# 04 — Expanded Themes & Frosted Glassmorphism for Live Backgrounds

**What to build:** Expand the theme library with 4 new curated themes (**Catppuccin Mocha**, **Dracula Pro**, **Gruvbox Dark**, **Catppuccin Latte**). When a Live Background is active, panels (sidebar, note editor, dashboard cards) must become frosted glass with translucent theme tints and `backdrop-filter: blur(16px)`, ensuring the live background is visible while preserving WCAG AA text contrast.

**Blocked by:** None — can start immediately.

**Status:** Done

- [x] Theme service supports 7 distinct palettes: `rose-pine`, `nord`, `tokyo-night`, `catppuccin-mocha`, `dracula-pro`, `gruvbox-dark`, `catppuccin-latte`.
- [x] Settings modal allows previewing and switching between all 7 themes.
- [x] Activating a Live Background adds glassmorphic translucency (`backdrop-filter: blur(16px)`) to panels without breaking text contrast.
- [x] Preset live backgrounds render distinctly with instant opacity and blur controls.
- [x] Automated tests in `themeService.test.ts` and `SettingsModal.test.tsx` pass.
