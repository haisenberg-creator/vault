# 05 — Global OS Keyboard Shortcuts

**What to build:** Integrate Tauri's `@tauri-apps/plugin-global-shortcut` to enable system-wide hotkeys that work even when Vault is in the background or minimized: `Ctrl+Alt+N` brings Vault to the foreground and creates a new Note, and `Ctrl+Alt+P` brings Vault to the foreground with the Quick Switcher command palette open.

**Blocked by:** 04 — Local Keyboard Shortcuts & Quick Switcher

**Status:** closed

- [x] `@tauri-apps/plugin-global-shortcut` is configured in Tauri v2 permissions and Rust backend
- [x] Pressing `Ctrl+Alt+N` globally (from any application) unminimizes/focuses Vault and creates a new Note
- [x] Pressing `Ctrl+Alt+P` globally (from any application) unminimizes/focuses Vault and opens the Quick Switcher
- [x] Global shortcuts are unregistered cleanly when the application exits
- [x] App falls back gracefully in web/browser mock environments without errors
- [x] Tests verify shortcut registration and fallback lifecycle
