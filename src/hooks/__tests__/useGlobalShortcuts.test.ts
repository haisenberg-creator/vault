import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGlobalShortcuts } from "../useGlobalShortcuts";
import * as globalShortcutService from "../../services/globalShortcutService";

describe("useGlobalShortcuts Hook", () => {
  let registerSpy: ReturnType<typeof vi.spyOn>;
  let unregisterSpy: ReturnType<typeof vi.spyOn>;
  let cleanupMock: () => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanupMock = vi.fn(async () => {});
    registerSpy = vi
      .spyOn(globalShortcutService, "registerGlobalShortcuts")
      .mockImplementation(async () => cleanupMock);
    unregisterSpy = vi
      .spyOn(globalShortcutService, "unregisterGlobalShortcuts")
      .mockResolvedValue(undefined);
  });

  it("registers global shortcuts on mount when enabled", async () => {
    const onNewNote = vi.fn();
    const onOpenQuickSwitcher = vi.fn();

    const { unmount } = renderHook(() =>
      useGlobalShortcuts({ onNewNote, onOpenQuickSwitcher, enabled: true })
    );

    expect(registerSpy).toHaveBeenCalledWith({
      onNewNote: expect.any(Function),
      onOpenQuickSwitcher: expect.any(Function),
    });

    unmount();
    await waitFor(() => {
      expect(cleanupMock).toHaveBeenCalled();
    });
  });

  it("does not register when enabled is false", () => {
    const onNewNote = vi.fn();
    const onOpenQuickSwitcher = vi.fn();

    renderHook(() =>
      useGlobalShortcuts({ onNewNote, onOpenQuickSwitcher, enabled: false })
    );

    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("unregisters shortcuts on window beforeunload event", () => {
    const onNewNote = vi.fn();
    const onOpenQuickSwitcher = vi.fn();

    const { unmount } = renderHook(() =>
      useGlobalShortcuts({ onNewNote, onOpenQuickSwitcher })
    );

    window.dispatchEvent(new Event("beforeunload"));
    expect(unregisterSpy).toHaveBeenCalled();

    unmount();
  });

  it("invokes latest handler functions without re-registering on re-render", async () => {
    let currentNewNote = vi.fn();
    const onOpenQuickSwitcher = vi.fn();

    let capturedOptions: globalShortcutService.GlobalShortcutHandlers | null =
      null;
    registerSpy.mockImplementation(
      async (opts: globalShortcutService.GlobalShortcutHandlers) => {
        capturedOptions = opts;
        return cleanupMock;
      }
    );

    const { rerender } = renderHook(
      ({ onNewNote }) => useGlobalShortcuts({ onNewNote, onOpenQuickSwitcher }),
      { initialProps: { onNewNote: currentNewNote } }
    );

    expect(registerSpy).toHaveBeenCalledTimes(1);

    // Update the onNewNote callback
    const updatedNewNote = vi.fn();
    rerender({ onNewNote: updatedNewNote });

    // Should NOT re-register
    expect(registerSpy).toHaveBeenCalledTimes(1);

    // Invoking the registered callback should trigger the updated function
    expect(capturedOptions).not.toBeNull();
    await capturedOptions!.onNewNote?.();

    expect(currentNewNote).not.toHaveBeenCalled();
    expect(updatedNewNote).toHaveBeenCalledTimes(1);
  });
});
