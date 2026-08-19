import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  focusVaultWindow,
  registerGlobalShortcuts,
  unregisterGlobalShortcuts,
  GLOBAL_SHORTCUT_NEW_NOTE,
  GLOBAL_SHORTCUT_QUICK_SWITCHER,
} from "../globalShortcutService";
import type {
  ShortcutHandler,
  ShortcutEvent,
} from "@tauri-apps/plugin-global-shortcut";

const mockUnminimize = vi.fn().mockResolvedValue(undefined);
const mockShow = vi.fn().mockResolvedValue(undefined);
const mockSetFocus = vi.fn().mockResolvedValue(undefined);
const mockIsMinimized = vi.fn().mockResolvedValue(false);

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    isMinimized: mockIsMinimized,
    unminimize: mockUnminimize,
    show: mockShow,
    setFocus: mockSetFocus,
  })),
}));

const mockRegister = vi.fn();
const mockUnregister = vi.fn();
const mockUnregisterAll = vi.fn();
const mockIsRegistered = vi.fn();

vi.mock("@tauri-apps/plugin-global-shortcut", () => ({
  register: (...args: unknown[]) => mockRegister(...args),
  unregister: (...args: unknown[]) => mockUnregister(...args),
  unregisterAll: (...args: unknown[]) => mockUnregisterAll(...args),
  isRegistered: (...args: unknown[]) => mockIsRegistered(...args),
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
