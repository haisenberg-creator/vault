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

      if (
        event.shortcut.toLowerCase() === GLOBAL_SHORTCUT_NEW_NOTE.toLowerCase()
      ) {
        await focusVaultWindow();
        await handlers.onNewNote?.();
      } else if (
        event.shortcut.toLowerCase() ===
        GLOBAL_SHORTCUT_QUICK_SWITCHER.toLowerCase()
      ) {
        await focusVaultWindow();
        await handlers.onOpenQuickSwitcher?.();
      }
    };

    // Register both shortcuts
    await register(GLOBAL_SHORTCUT_NEW_NOTE, shortcutHandler);
    await register(GLOBAL_SHORTCUT_QUICK_SWITCHER, shortcutHandler);

    return async () => {
      try {
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
