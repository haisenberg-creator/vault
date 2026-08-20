import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  focusVaultWindow,
  registerGlobalShortcuts,
  unregisterGlobalShortcuts,
  normalizeShortcut,
  isShortcutMatch,
  GLOBAL_SHORTCUT_NEW_NOTE,
  GLOBAL_SHORTCUT_QUICK_SWITCHER,
} from "../globalShortcutService";
import type {
  ShortcutHandler,
  ShortcutEvent,
} from "@tauri-apps/plugin-global-shortcut";

const {
  mockRegister,
  mockUnregister,
  mockUnregisterAll,
  mockIsRegistered,
  mockListen,
  mockUnminimize,
  mockShow,
  mockSetFocus,
  mockIsMinimized,
} = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockUnregister: vi.fn(),
  mockUnregisterAll: vi.fn(),
  mockIsRegistered: vi.fn(),
  mockListen: vi.fn().mockImplementation((_event: string, _cb: unknown) => {
    return Promise.resolve(vi.fn());
  }),
  mockUnminimize: vi.fn().mockResolvedValue(undefined),
  mockShow: vi.fn().mockResolvedValue(undefined),
  mockSetFocus: vi.fn().mockResolvedValue(undefined),
  mockIsMinimized: vi.fn().mockResolvedValue(false),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    isMinimized: mockIsMinimized,
    unminimize: mockUnminimize,
    show: mockShow,
    setFocus: mockSetFocus,
  })),
}));

vi.mock("@tauri-apps/plugin-global-shortcut", () => ({
  register: (...args: unknown[]) => mockRegister(...args),
  unregister: (...args: unknown[]) => mockUnregister(...args),
  unregisterAll: (...args: unknown[]) => mockUnregisterAll(...args),
  isRegistered: (...args: unknown[]) => mockIsRegistered(...args),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => mockListen(...args),
}));

describe("globalShortcutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMinimized.mockResolvedValue(false);
  });

  afterEach(() => {
    // @ts-expect-error test cleanup
    delete window.__TAURI_INTERNALS__;
  });

  describe("focusVaultWindow", () => {
    it("does nothing in browser/non-Tauri environment", async () => {
      // No window.__TAURI_INTERNALS__
      await focusVaultWindow();

      expect(mockShow).not.toHaveBeenCalled();
      expect(mockSetFocus).not.toHaveBeenCalled();
      expect(mockUnminimize).not.toHaveBeenCalled();
    });

    it("shows and focuses window in Tauri environment when not minimized", async () => {
      // @ts-expect-error mock tauri internals
      window.__TAURI_INTERNALS__ = {};

      await focusVaultWindow();

      expect(mockIsMinimized).toHaveBeenCalled();
      expect(mockUnminimize).not.toHaveBeenCalled();
      expect(mockShow).toHaveBeenCalled();
      expect(mockSetFocus).toHaveBeenCalled();
    });

    it("unminimizes, shows, and focuses window when minimized in Tauri", async () => {
      // @ts-expect-error mock tauri internals
      window.__TAURI_INTERNALS__ = {};
      mockIsMinimized.mockResolvedValue(true);

      await focusVaultWindow();

      expect(mockIsMinimized).toHaveBeenCalled();
      expect(mockUnminimize).toHaveBeenCalled();
      expect(mockShow).toHaveBeenCalled();
      expect(mockSetFocus).toHaveBeenCalled();
    });
  });

  describe("registerGlobalShortcuts", () => {
    it("safely skips registration in non-Tauri environment and returns no-op cleanup", async () => {
      const onNewNote = vi.fn();
      const onOpenQuickSwitcher = vi.fn();

      const cleanup = await registerGlobalShortcuts({
        onNewNote,
        onOpenQuickSwitcher,
      });

      expect(mockRegister).not.toHaveBeenCalled();
      await cleanup();
      expect(mockUnregister).not.toHaveBeenCalled();
    });

    it("registers shortcuts in Tauri and triggers callbacks on Pressed state", async () => {
      // @ts-expect-error mock tauri internals
      window.__TAURI_INTERNALS__ = {};

      const registeredHandlers = new Map<string, ShortcutHandler>();
      mockRegister.mockImplementation(
        async (shortcut: string, handler: ShortcutHandler) => {
          registeredHandlers.set(shortcut, handler);
        }
      );

      const onNewNote = vi.fn();
      const onOpenQuickSwitcher = vi.fn();

      const cleanup = await registerGlobalShortcuts({
        onNewNote,
        onOpenQuickSwitcher,
      });

      expect(mockRegister).toHaveBeenCalledWith(
        GLOBAL_SHORTCUT_NEW_NOTE,
        expect.any(Function)
      );
      expect(mockRegister).toHaveBeenCalledWith(
        GLOBAL_SHORTCUT_QUICK_SWITCHER,
        expect.any(Function)
      );

      // Trigger New Note shortcut Pressed
      const noteHandler = registeredHandlers.get(GLOBAL_SHORTCUT_NEW_NOTE);
      expect(noteHandler).toBeDefined();

      const pressEventNote: ShortcutEvent = {
        shortcut: GLOBAL_SHORTCUT_NEW_NOTE,
        id: 1,
        state: "Pressed",
      };
      await noteHandler!(pressEventNote);

      expect(mockShow).toHaveBeenCalled();
      expect(mockSetFocus).toHaveBeenCalled();
      expect(onNewNote).toHaveBeenCalledTimes(1);

      // Trigger Quick Switcher shortcut Pressed
      const switcherHandler = registeredHandlers.get(
        GLOBAL_SHORTCUT_QUICK_SWITCHER
      );
      expect(switcherHandler).toBeDefined();

      const pressEventSwitcher: ShortcutEvent = {
        shortcut: GLOBAL_SHORTCUT_QUICK_SWITCHER,
        id: 2,
        state: "Pressed",
      };
      await switcherHandler!(pressEventSwitcher);

      expect(onOpenQuickSwitcher).toHaveBeenCalledTimes(1);

      // Release event should NOT trigger callbacks
      const releaseEvent: ShortcutEvent = {
        shortcut: GLOBAL_SHORTCUT_NEW_NOTE,
        id: 1,
        state: "Released",
      };
      await noteHandler!(releaseEvent);
      expect(onNewNote).toHaveBeenCalledTimes(1);

      // Call cleanup
      await cleanup();
      expect(mockUnregister).toHaveBeenCalledWith([
        GLOBAL_SHORTCUT_NEW_NOTE,
        GLOBAL_SHORTCUT_QUICK_SWITCHER,
      ]);
    });

    it("triggers callbacks when OS events send platform-specific variations like Ctrl+Alt+N or Cmd+Opt+P", async () => {
      // @ts-expect-error mock tauri internals
      window.__TAURI_INTERNALS__ = {};

      const registeredHandlers = new Map<string, ShortcutHandler>();
      mockRegister.mockImplementation(
        async (shortcut: string, handler: ShortcutHandler) => {
          registeredHandlers.set(shortcut, handler);
        }
      );

      const onNewNote = vi.fn();
      const onOpenQuickSwitcher = vi.fn();

      await registerGlobalShortcuts({
        onNewNote,
        onOpenQuickSwitcher,
      });

      const noteHandler = registeredHandlers.get(GLOBAL_SHORTCUT_NEW_NOTE);
      const switcherHandler = registeredHandlers.get(
        GLOBAL_SHORTCUT_QUICK_SWITCHER
      );

      // Trigger with "Ctrl+Alt+N"
      await noteHandler!({
        shortcut: "Ctrl+Alt+N",
        id: 1,
        state: "Pressed",
      });
      expect(onNewNote).toHaveBeenCalledTimes(1);

      // Trigger with "cmd+opt+p"
      await switcherHandler!({
        shortcut: "cmd+opt+p",
        id: 2,
        state: "Pressed",
      });
      expect(onOpenQuickSwitcher).toHaveBeenCalledTimes(1);
    });

    it("listens to system tray events and invokes corresponding handlers", async () => {
      // @ts-expect-error mock tauri internals
      window.__TAURI_INTERNALS__ = {};

      const eventListeners = new Map<string, Function>();
      mockListen.mockImplementation(async (eventName: string, cb: Function) => {
        eventListeners.set(eventName, cb);
        return () => eventListeners.delete(eventName);
      });

      const onNewNote = vi.fn();
      const onOpenQuickSwitcher = vi.fn();

      const cleanup = await registerGlobalShortcuts({
        onNewNote,
        onOpenQuickSwitcher,
      });

      expect(mockListen).toHaveBeenCalledWith(
        "tray-new-note",
        expect.any(Function)
      );
      expect(mockListen).toHaveBeenCalledWith(
        "tray-quick-switcher",
        expect.any(Function)
      );

      // Trigger tray new note
      const trayNoteCb = eventListeners.get("tray-new-note");
      expect(trayNoteCb).toBeDefined();
      await trayNoteCb!();
      expect(mockShow).toHaveBeenCalled();
      expect(mockSetFocus).toHaveBeenCalled();
      expect(onNewNote).toHaveBeenCalledTimes(1);

      // Trigger tray quick switcher
      const traySwitcherCb = eventListeners.get("tray-quick-switcher");
      expect(traySwitcherCb).toBeDefined();
      await traySwitcherCb!();
      expect(onOpenQuickSwitcher).toHaveBeenCalledTimes(1);

      await cleanup();
    });
  });

  describe("normalizeShortcut & isShortcutMatch", () => {
    it("normalizes modifiers and order correctly", () => {
      expect(normalizeShortcut("CommandOrControl+Alt+N")).toBe("alt+mod+n");
      expect(normalizeShortcut("Ctrl+Alt+N")).toBe("alt+mod+n");
      expect(normalizeShortcut("Alt+Control+N")).toBe("alt+mod+n");
      expect(normalizeShortcut("cmd+opt+p")).toBe("alt+mod+p");
      expect(normalizeShortcut("CommandOrControl+Alt+P")).toBe("alt+mod+p");
      expect(normalizeShortcut("Alt+Control+KeyN")).toBe("alt+mod+n");
      expect(normalizeShortcut("CommandOrControl+Alt+KeyP")).toBe("alt+mod+p");
    });

    it("matches equivalent shortcuts across platforms", () => {
      expect(isShortcutMatch("Ctrl+Alt+N", "CommandOrControl+Alt+N")).toBe(
        true
      );
      expect(isShortcutMatch("Cmd+Opt+P", "CommandOrControl+Alt+P")).toBe(true);
      expect(isShortcutMatch("Alt+Ctrl+N", "CommandOrControl+Alt+N")).toBe(
        true
      );
      expect(isShortcutMatch("Ctrl+Alt+KeyN", "CommandOrControl+Alt+N")).toBe(
        true
      );
      expect(isShortcutMatch("Ctrl+Alt+P", "CommandOrControl+Alt+N")).toBe(
        false
      );
      expect(isShortcutMatch("", "Ctrl+Alt+N")).toBe(false);
    });
  });

  describe("unregisterGlobalShortcuts", () => {
    it("safely unregisters shortcuts in Tauri", async () => {
      // @ts-expect-error mock tauri internals
      window.__TAURI_INTERNALS__ = {};

      await unregisterGlobalShortcuts();

      expect(mockUnregister).toHaveBeenCalledWith([
        GLOBAL_SHORTCUT_NEW_NOTE,
        GLOBAL_SHORTCUT_QUICK_SWITCHER,
      ]);
    });

    it("does nothing in non-Tauri environment", async () => {
      await unregisterGlobalShortcuts();
      expect(mockUnregister).not.toHaveBeenCalled();
    });
  });
});
