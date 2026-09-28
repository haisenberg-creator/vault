import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  WorkspaceSessionState,
  SESSION_STORAGE_KEY,
  DEFAULT_SESSION_STATE,
  loadSession,
  saveSession,
  flushSession,
  clearSession,
  validateSessionState,
  pruneSessionFiles,
} from "../sessionService";

describe("sessionService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    clearSession();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("validateSessionState & defaults", () => {
    it("returns default session state when given null, undefined, or empty object", () => {
      expect(validateSessionState(null)).toEqual(DEFAULT_SESSION_STATE);
      expect(validateSessionState(undefined)).toEqual(DEFAULT_SESSION_STATE);
      expect(validateSessionState({})).toEqual(DEFAULT_SESSION_STATE);
      expect(validateSessionState("not-an-object")).toEqual(
        DEFAULT_SESSION_STATE
      );
    });

    it("preserves valid fields and sanitizes invalid types to defaults", () => {
      const partialRaw = {
        activeFilename: "workspace/notes/idea.md",
        isSplitView: true,
        rightFilename: "workspace/notes/outline.md",
        splitRatio: 0.65,
        isSidebarCollapsed: true,
        sidebarWidth: 320,
        expandedPaths: ["workspace", "workspace/notes"],
        activeFilter: "in_progress",
        activeTagFilter: "#project",
      };

      const validated = validateSessionState(partialRaw);
      expect(validated).toEqual(partialRaw);
    });

    it("clamps splitRatio between 0.2 and 0.8 and sidebarWidth between 180 and 800", () => {
      const outOfBounds = {
        splitRatio: 0.05,
        sidebarWidth: 100,
      };
      const validated = validateSessionState(outOfBounds);
      expect(validated.splitRatio).toBe(0.2);
      expect(validated.sidebarWidth).toBe(180);

      const upperBounds = {
        splitRatio: 0.95,
        sidebarWidth: 1200,
      };
      const validatedUpper = validateSessionState(upperBounds);
      expect(validatedUpper.splitRatio).toBe(0.8);
      expect(validatedUpper.sidebarWidth).toBe(800);
    });

    it("falls back invalid activeFilter to 'all'", () => {
      const invalidFilter = {
        activeFilter: "unknown-filter-value",
      };
      const validated = validateSessionState(invalidFilter);
      expect(validated.activeFilter).toBe("all");
    });

    it("falls back non-array or non-string expandedPaths to ['']", () => {
      expect(
        validateSessionState({ expandedPaths: "not-an-array" }).expandedPaths
      ).toEqual([""]);
      expect(
        validateSessionState({ expandedPaths: [123, null] }).expandedPaths
      ).toEqual([""]);
    });
  });

  describe("loadSession", () => {
    it("returns DEFAULT_SESSION_STATE if localStorage has no saved session", () => {
      const session = loadSession();
      expect(session).toEqual(DEFAULT_SESSION_STATE);
    });

    it("loads and parses valid session from localStorage", () => {
      const saved: WorkspaceSessionState = {
        activeFilename: "todo.md",
        isSplitView: true,
        rightFilename: "reference.md",
        splitRatio: 0.4,
        isSidebarCollapsed: false,
        sidebarWidth: 280,
        expandedPaths: ["folder1"],
        activeFilter: "completed",
        activeTagFilter: null,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saved));

      const loaded = loadSession();
      expect(loaded).toEqual(saved);
    });

    it("recovers gracefully from corrupted JSON in localStorage", () => {
      localStorage.setItem(SESSION_STORAGE_KEY, "{broken-json-string-");
      const loaded = loadSession();
      expect(loaded).toEqual(DEFAULT_SESSION_STATE);
    });
  });

  describe("saveSession & debouncing", () => {
    it("debounces saves by 150ms", () => {
      saveSession({ activeFilename: "note1.md" });

      // Before 150ms, localStorage should not be updated yet
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

      vi.advanceTimersByTime(100);
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

      // Trigger another save before debounce expires
      saveSession({ activeFilename: "note2.md", isSplitView: true });

      vi.advanceTimersByTime(100);
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

      // Complete the remaining time
      vi.advanceTimersByTime(50);
      const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!);
      expect(stored.activeFilename).toBe("note2.md");
      expect(stored.isSplitView).toBe(true);
    });

    it("supports immediate flush option", () => {
      saveSession({ sidebarWidth: 350 }, true);

      const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!);
      expect(stored.sidebarWidth).toBe(350);
    });

    it("flushSession immediately commits pending debounced save", () => {
      saveSession({ splitRatio: 0.7 });
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

      flushSession();
      const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!);
      expect(stored.splitRatio).toBe(0.7);
    });

    it("clearSession removes stored session and cancels pending debounce", () => {
      saveSession({ isSidebarCollapsed: true });
      clearSession();

      vi.advanceTimersByTime(200);
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  describe("pruneSessionFiles", () => {
    it("keeps activeFilename and rightFilename if they exist in workspace files", () => {
      const session: WorkspaceSessionState = {
        ...DEFAULT_SESSION_STATE,
        activeFilename: "workspace/notes/active.md",
        rightFilename: "workspace/notes/right.md",
        isSplitView: true,
      };

      const workspaceFiles = [
        "workspace/notes/active.md",
        "workspace/notes/right.md",
        "workspace/other.md",
      ];

      const pruned = pruneSessionFiles(session, workspaceFiles);
      expect(pruned.activeFilename).toBe("workspace/notes/active.md");
      expect(pruned.rightFilename).toBe("workspace/notes/right.md");
    });

    it("prunes activeFilename when missing and falls back to first available note", () => {
      const session: WorkspaceSessionState = {
        ...DEFAULT_SESSION_STATE,
        activeFilename: "workspace/notes/deleted.md",
        rightFilename: null,
      };

      const workspaceFiles = [
        "workspace/notes/first.md",
        "workspace/notes/second.md",
      ];
      const pruned = pruneSessionFiles(session, workspaceFiles);

      expect(pruned.activeFilename).toBe("workspace/notes/first.md");
    });

    it("prunes activeFilename to null if workspace is empty", () => {
      const session: WorkspaceSessionState = {
        ...DEFAULT_SESSION_STATE,
        activeFilename: "workspace/notes/deleted.md",
      };

      const pruned = pruneSessionFiles(session, []);
      expect(pruned.activeFilename).toBeNull();
    });

    it("prunes rightFilename when missing and sets it to null without throwing", () => {
      const session: WorkspaceSessionState = {
        ...DEFAULT_SESSION_STATE,
        activeFilename: "workspace/notes/active.md",
        rightFilename: "workspace/notes/deleted-right.md",
        isSplitView: true,
      };

      const workspaceFiles = ["workspace/notes/active.md"];
      const pruned = pruneSessionFiles(session, workspaceFiles);

      expect(pruned.activeFilename).toBe("workspace/notes/active.md");
      expect(pruned.rightFilename).toBeNull();
    });

    it("matches files with flexible path prefixes (relative or normalized)", () => {
      const session: WorkspaceSessionState = {
        ...DEFAULT_SESSION_STATE,
        activeFilename: "notes/active.md",
        rightFilename: "right.md",
      };

      const workspaceFiles = [
        "workspace/notes/active.md",
        "workspace/right.md",
      ];

      const pruned = pruneSessionFiles(session, workspaceFiles);
      expect(pruned.activeFilename).toBe("notes/active.md");
      expect(pruned.rightFilename).toBe("right.md");
    });
  });
});
