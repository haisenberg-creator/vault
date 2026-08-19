# 05 — Global OS Keyboard Shortcuts

**What to build:** Integrate Tauri's `@tauri-apps/plugin-global-shortcut` to enable system-wide hotkeys that work even when Vault is in the background or minimized: `Ctrl+Alt+N` brings Vault to the foreground and creates a new Note, and `Ctrl+Alt+P` brings Vault to the foreground with the Quick Switcher command palette open.

**Blocked by:** 04 — Local Keyboard Shortcuts & Quick Switcher

**Status:** ready-for-agent

- [ ] `@tauri-apps/plugin-global-shortcut` is configured in Tauri v2 permissions and Rust backend
- [ ] Pressing `Ctrl+Alt+N` globally (from any application) unminimizes/focuses Vault and creates a new Note
- [ ] Pressing `Ctrl+Alt+P` globally (from any application) unminimizes/focuses Vault and opens the Quick Switcher
- [ ] Global shortcuts are unregistered cleanly when the application exits
- [ ] App falls back gracefully in web/browser mock environments without errors
- [ ] Tests verify shortcut registration and fallback lifecycle
