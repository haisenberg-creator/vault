import { isTauriEnvironment } from "./fileService";
import type {
  ShortcutEvent,
  ShortcutHandler,
} from "@tauri-apps/plugin-global-shortcut";

export interface GlobalShortcutHandlers {
  onNewNote?: () => void | Promise<void>;
  onOpenQuickSwitcher?: () => void | Promise<void>;
}

export const GLOBAL_SHORTCUT_NEW_NOTE = "CommandOrControl+Alt+N";
export const GLOBAL_SHORTCUT_QUICK_SWITCHER = "CommandOrControl+Alt+P";

/**
 * Normalizes shortcut strings (e.g., "Ctrl+Alt+N", "cmd+opt+n", "CommandOrControl+Alt+N")
 * into a canonical token string for cross-platform event matching.
 */
export function normalizeShortcut(shortcut: string): string {
  if (!shortcut) return "";
  const parts = shortcut
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);

  const normalizedParts = parts.map((part) => {
    if (
      [
        "commandorcontrol",
        "ctrl",
        "control",
        "cmd",
        "command",
        "superorcontrol",
      ].includes(part)
    ) {
      return "mod";
    }
    if (["alt", "opt", "option"].includes(part)) {
      return "alt";
    }
    if (["shift"].includes(part)) {
      return "shift";
    }
    if (["super", "meta", "win", "windows"].includes(part)) {
      return "super";
    }
    if (part.startsWith("key") && part.length > 3) {
      return part.slice(3);
    }
    return part;
  });

  return normalizedParts.sort().join("+");
}

/**
 * Checks whether an incoming shortcut event string matches the target registered shortcut.
 */
export function isShortcutMatch(received: string, target: string): boolean {
  if (!received || !target) return false;
  return normalizeShortcut(received) === normalizeShortcut(target);
}

/**
 * Brings the Vault desktop window to the foreground:
 * unminimizes if minimized, shows window, and requests focus.
 */
export async function focusVaultWindow(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    if (await appWindow.isMinimized()) {
      await appWindow.unminimize();
    }
    await appWindow.show();
    await appWindow.setFocus();
  } catch (err) {
    console.warn("[globalShortcutService] Failed to focus Vault window:", err);
  }
}

/**
 * Registers OS-level global shortcuts (Ctrl+Alt+N for New Note, Ctrl+Alt+P for Quick Switcher).
 * Automatically unminimizes and focuses Vault before invoking the corresponding handler.
 * Also listens to System Tray events when available.
 *
 * Returns a cleanup unregister function.
 */
export async function registerGlobalShortcuts(
  handlers: GlobalShortcutHandlers
): Promise<() => Promise<void>> {
  if (!isTauriEnvironment()) {
    return async () => {};
  }

  try {
    const { register, unregister } =
      await import("@tauri-apps/plugin-global-shortcut");

    const shortcutHandler: ShortcutHandler = async (event: ShortcutEvent) => {
      if (event.state !== "Pressed") return;

      if (isShortcutMatch(event.shortcut, GLOBAL_SHORTCUT_NEW_NOTE)) {
        await focusVaultWindow();
        await handlers.onNewNote?.();
      } else if (
        isShortcutMatch(event.shortcut, GLOBAL_SHORTCUT_QUICK_SWITCHER)
      ) {
        await focusVaultWindow();
        await handlers.onOpenQuickSwitcher?.();
      }
    };

    // Register both shortcuts
    await register(GLOBAL_SHORTCUT_NEW_NOTE, shortcutHandler);
    await register(GLOBAL_SHORTCUT_QUICK_SWITCHER, shortcutHandler);

    let unlistenNewNote: (() => void) | undefined;
    let unlistenQuickSwitcher: (() => void) | undefined;

    try {
      const { listen } = await import("@tauri-apps/api/event");
      unlistenNewNote = await listen("tray-new-note", async () => {
        await focusVaultWindow();
        await handlers.onNewNote?.();
      });
      unlistenQuickSwitcher = await listen("tray-quick-switcher", async () => {
        await focusVaultWindow();
        await handlers.onOpenQuickSwitcher?.();
      });
    } catch {
      // Ignore if event listening is not available
    }

    return async () => {
      try {
        if (unlistenNewNote) unlistenNewNote();
        if (unlistenQuickSwitcher) unlistenQuickSwitcher();
        await unregister([
          GLOBAL_SHORTCUT_NEW_NOTE,
          GLOBAL_SHORTCUT_QUICK_SWITCHER,
        ]);
      } catch (err) {
        console.warn(
          "[globalShortcutService] Failed to unregister global shortcuts:",
          err
        );
      }
    };
  } catch (err) {
    console.warn(
      "[globalShortcutService] Failed to register global shortcuts:",
      err
    );
    return async () => {};
  }
}

/**
 * Unregisters all registered global shortcuts safely.
 */
export async function unregisterGlobalShortcuts(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { unregister } = await import("@tauri-apps/plugin-global-shortcut");
    await unregister([
      GLOBAL_SHORTCUT_NEW_NOTE,
      GLOBAL_SHORTCUT_QUICK_SWITCHER,
    ]);
  } catch (err) {
    console.warn(
      "[globalShortcutService] Failed to unregister global shortcuts:",
      err
    );
  }
}
