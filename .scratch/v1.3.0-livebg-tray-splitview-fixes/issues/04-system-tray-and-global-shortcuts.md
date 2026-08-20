# 04 — System Tray Integration & Resilient Global OS Shortcuts

**What to build:** Configures a Tauri System Tray icon so Vault stays resident in the OS notification area when minimized or closed with "Close to Tray". Normalizes global shortcut tokens and implements atomic window restoration (`unminimize()` + `show()` + `setFocus()`) ensuring `Ctrl+Alt+N` (New Note) and `Ctrl+Alt+P` (Quick Switcher) trigger reliably system-wide.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Tauri System Tray icon is configured and visible in the OS notification area.
- [x] Clicking the System Tray icon toggles Vault window visibility.
- [x] Context menu on the System Tray icon provides quick access to "Open Vault", "Quick Switcher", "New Note", and "Quit".
- [x] When minimized or closed with "Close to Tray" active, the Vault window hides from the taskbar without exiting the background process.
- [x] Pressing `Ctrl+Alt+N` (or `Cmd+Option+N`) anywhere in the OS unminimizes/shows Vault, focuses the window, and triggers New Note creation.
- [x] Pressing `Ctrl+Alt+P` (or `Cmd+Option+P`) anywhere in the OS unminimizes/shows Vault, focuses the window, and opens the Quick Switcher palette.
- [x] Unit and service tests verify shortcut string normalization, handler registration, and focus restoration logic.
