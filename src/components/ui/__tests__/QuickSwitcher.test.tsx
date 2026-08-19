import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  QuickSwitcher,
  calculateFuzzyScore,
  QuickSwitcherNote,
} from "../QuickSwitcher";

describe("QuickSwitcher Component", () => {
  const mockNotes: QuickSwitcherNote[] = [
    { path: "workspace/index.md", name: "index.md" },
    { path: "workspace/docs/architecture.md", name: "architecture.md" },
    { path: "workspace/docs/roadmap.md", name: "roadmap.md" },
    { path: "workspace/projects/vault-release.md", name: "vault-release.md" },
    { path: "workspace/notes/daily-log.md", name: "daily-log.md" },
  ];

  const defaultProps = {
    isOpen: true,
    notes: mockNotes,
    activeFilePath: "workspace/index.md",
    workspaceDir: "workspace",
    onSelectNote: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateFuzzyScore algorithm", () => {
    it("returns 1 for empty query", () => {
      expect(calculateFuzzyScore("", "notes.md", "workspace/notes.md")).toBe(1);
    });

    it("gives highest score to exact filename matches", () => {
      const exactScore = calculateFuzzyScore(
        "roadmap",
        "roadmap.md",
        "workspace/docs/roadmap.md"
      );
      const partialScore = calculateFuzzyScore(
        "road",
        "roadmap.md",
        "workspace/docs/roadmap.md"
      );
      expect(exactScore).toBeGreaterThan(partialScore);
    });

    it("scores prefix matches higher than subsequence matches", () => {
      const prefixScore = calculateFuzzyScore(
        "arch",
        "architecture.md",
        "workspace/docs/architecture.md"
      );
      const subseqScore = calculateFuzzyScore(
        "art",
        "architecture.md",
        "workspace/docs/architecture.md"
      );
      expect(prefixScore).toBeGreaterThan(subseqScore);
    });

    it("matches character subsequence across words or paths", () => {
      const score = calculateFuzzyScore(
        "pvr",
        "vault-release.md",
        "workspace/projects/vault-release.md"
      );
      expect(score).toBeGreaterThan(0);
    });

    it("returns 0 for non-matching strings", () => {
      const score = calculateFuzzyScore(
        "xyz999",
        "index.md",
        "workspace/index.md"
      );
      expect(score).toBe(0);
    });
  });

  describe("Modal Rendering & Visibility", () => {
    it("renders nothing when isOpen is false", () => {
      render(<QuickSwitcher {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId("quick-switcher-modal")).toBeNull();
    });

    it("renders modal, search input, and initial note list when isOpen is true", () => {
      render(<QuickSwitcher {...defaultProps} />);
      expect(screen.getByTestId("quick-switcher-modal")).toBeDefined();
      expect(screen.getByTestId("quick-switcher-input")).toBeDefined();
      expect(screen.getByText("index.md")).toBeDefined();
      expect(screen.getByText("architecture.md")).toBeDefined();
      expect(screen.getByText("roadmap.md")).toBeDefined();
    });

    it("marks the active file with an active badge", () => {
      render(<QuickSwitcher {...defaultProps} />);
      expect(screen.getByText("active")).toBeDefined();
    });
  });

  describe("Fuzzy Filtering in UI", () => {
    it("filters notes list as the user types", () => {
      render(<QuickSwitcher {...defaultProps} />);
      const input = screen.getByTestId("quick-switcher-input");

      fireEvent.change(input, { target: { value: "road" } });

      expect(screen.getByText("roadmap.md")).toBeDefined();
      expect(screen.queryByText("architecture.md")).toBeNull();
      expect(screen.queryByText("daily-log.md")).toBeNull();
    });

    it("displays empty state message when no notes match query", () => {
      render(<QuickSwitcher {...defaultProps} />);
      const input = screen.getByTestId("quick-switcher-input");

      fireEvent.change(input, { target: { value: "nonexistent-doc-search" } });

      expect(screen.getByTestId("quick-switcher-empty")).toBeDefined();
      expect(
        screen.getByText('No matching notes found for "nonexistent-doc-search"')
      ).toBeDefined();
    });
  });

  describe("Keyboard Navigation & Selection", () => {
    it("navigates down and up using ArrowDown and ArrowUp", () => {
      render(<QuickSwitcher {...defaultProps} />);
      const input = screen.getByTestId("quick-switcher-input");

      const firstItem = screen.getByTestId(
        "quick-switcher-item-workspace/index.md"
      );
      const secondItem = screen.getByTestId(
        "quick-switcher-item-workspace/docs/architecture.md"
      );

      expect(firstItem.getAttribute("data-selected")).toBe("true");
      expect(secondItem.getAttribute("data-selected")).toBe("false");

      // Press ArrowDown
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(firstItem.getAttribute("data-selected")).toBe("false");
      expect(secondItem.getAttribute("data-selected")).toBe("true");

      // Press ArrowUp
      fireEvent.keyDown(input, { key: "ArrowUp" });
      expect(firstItem.getAttribute("data-selected")).toBe("true");
      expect(secondItem.getAttribute("data-selected")).toBe("false");
    });

    it("wraps around to the beginning on ArrowDown past end", () => {
      render(<QuickSwitcher {...defaultProps} />);
      const input = screen.getByTestId("quick-switcher-input");

      // Press ArrowUp from 0 to wrap to last item
      fireEvent.keyDown(input, { key: "ArrowUp" });
      const lastItem = screen.getByTestId(
        "quick-switcher-item-workspace/notes/daily-log.md"
      );
      expect(lastItem.getAttribute("data-selected")).toBe("true");
    });

    it("selects focused note on Enter key press", () => {
      const onSelectNote = vi.fn();
      const onClose = vi.fn();
      render(
        <QuickSwitcher
          {...defaultProps}
          onSelectNote={onSelectNote}
          onClose={onClose}
        />
      );
      const input = screen.getByTestId("quick-switcher-input");

      // Arrow down to second note (architecture.md)
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onSelectNote).toHaveBeenCalledWith(
        "workspace/docs/architecture.md"
      );
      expect(onClose).toHaveBeenCalled();
    });

    it("closes modal on Escape key press", () => {
      const onClose = vi.fn();
      render(<QuickSwitcher {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Mouse Interactions", () => {
    it("selects note when clicked", () => {
      const onSelectNote = vi.fn();
      const onClose = vi.fn();
      render(
        <QuickSwitcher
          {...defaultProps}
          onSelectNote={onSelectNote}
          onClose={onClose}
        />
      );

      const item = screen.getByTestId(
        "quick-switcher-item-workspace/docs/roadmap.md"
      );
      fireEvent.click(item);

      expect(onSelectNote).toHaveBeenCalledWith("workspace/docs/roadmap.md");
      expect(onClose).toHaveBeenCalled();
    });

    it("updates selection on mouse hover", () => {
      render(<QuickSwitcher {...defaultProps} />);
      const targetItem = screen.getByTestId(
        "quick-switcher-item-workspace/projects/vault-release.md"
      );

      fireEvent.mouseEnter(targetItem);
      expect(targetItem.getAttribute("data-selected")).toBe("true");
    });

    it("closes modal on backdrop click", () => {
      const onClose = vi.fn();
      render(<QuickSwitcher {...defaultProps} onClose={onClose} />);

      const modalBackdrop = screen.getByTestId("quick-switcher-modal");
      fireEvent.click(modalBackdrop);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
