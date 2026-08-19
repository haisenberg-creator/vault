import { useEffect, useRef } from "react";
import {
  registerGlobalShortcuts,
  unregisterGlobalShortcuts,
  GlobalShortcutHandlers,
} from "../services/globalShortcutService";

export interface UseGlobalShortcutsOptions extends GlobalShortcutHandlers {
  enabled?: boolean;
}

/**
 * React hook that registers OS-level global shortcuts for Vault.
 *
 * - Ctrl+Alt+N / Cmd+Option+N: Focuses Vault and creates a new Note in the active directory.
 * - Ctrl+Alt+P / Cmd+Option+P: Focuses Vault and opens the Quick Switcher command palette.
 *
 * Automatically handles registration, unregistration on unmount, and cleanup on window unload.
 */
export function useGlobalShortcuts({
  onNewNote,
  onOpenQuickSwitcher,
  enabled = true,
}: UseGlobalShortcutsOptions = {}): void {
  const handlersRef = useRef<GlobalShortcutHandlers>({
    onNewNote,
    onOpenQuickSwitcher,
  });

  useEffect(() => {
    handlersRef.current = { onNewNote, onOpenQuickSwitcher };
  }, [onNewNote, onOpenQuickSwitcher]);

  useEffect(() => {
    if (!enabled) return;

    let cleanupFn: (() => Promise<void>) | null = null;
    let isMounted = true;

    registerGlobalShortcuts({
      onNewNote: async () => {
        await handlersRef.current.onNewNote?.();
      },
      onOpenQuickSwitcher: async () => {
        await handlersRef.current.onOpenQuickSwitcher?.();
      },
    }).then((cleanup) => {
      if (!isMounted) {
        cleanup();
      } else {
        cleanupFn = cleanup;
      }
    });

    const handleBeforeUnload = () => {
      unregisterGlobalShortcuts();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMounted = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [enabled]);
}
