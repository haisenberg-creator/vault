import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DualColumnLayout } from "../DualColumnLayout";
import * as fileService from "../../../services/fileService";

vi.mock("../../../services/fileService", () => ({
  readMarkdownFile: vi.fn(),
  writeMarkdownFile: vi.fn(),
}));

describe("DualColumnLayout Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts tasks from markdown file and displays them in sidebar", async () => {
    const mockMarkdown = `# Project Plan

- [ ] Task Open Feature
- [-] Task In Progress Feature
- [x] Task Completed Feature
`;
    vi.mocked(fileService.readMarkdownFile).mockResolvedValue(mockMarkdown);
    vi.mocked(fileService.writeMarkdownFile).mockResolvedValue();

    render(<DualColumnLayout filename="test-note.md" />);

    // Wait for document to load and editor to render
    await waitFor(() => {
      expect(screen.getByText("TASK DASHBOARD")).toBeInTheDocument();
    });

    // Check that extracted tasks appear in sidebar
    await waitFor(() => {
      expect(screen.getByText("Task Open Feature")).toBeInTheDocument();
      expect(screen.getByText("Task In Progress Feature")).toBeInTheDocument();
      expect(screen.getByText("Task Completed Feature")).toBeInTheDocument();
    });

    expect(screen.getByTestId("filter-btn-all")).toHaveTextContent("all (3)");
    expect(screen.getByTestId("filter-btn-open")).toHaveTextContent("open (1)");
    expect(screen.getByTestId("filter-btn-in_progress")).toHaveTextContent(
      "in progress (1)"
    );
    expect(screen.getByTestId("filter-btn-completed")).toHaveTextContent(
      "completed (1)"
    );
  });

  it("toggles task state in editor when clicked in sidebar", async () => {
    const mockMarkdown = `- [ ] Sync task from sidebar
`;
    vi.mocked(fileService.readMarkdownFile).mockResolvedValue(mockMarkdown);
    vi.mocked(fileService.writeMarkdownFile).mockResolvedValue();

    render(<DualColumnLayout filename="sync-note.md" />);

    await waitFor(() => {
      expect(screen.getByText("Sync task from sidebar")).toBeInTheDocument();
    });

    const taskItem = await screen.findByTestId(/^sidebar-task-item-/);
    expect(taskItem).toHaveAttribute("data-task-state", "open");

    // Click task in sidebar to toggle state from open -> in_progress
    fireEvent.click(taskItem);

    await waitFor(() => {
      expect(taskItem).toHaveAttribute("data-task-state", "in_progress");
    });

    // Verify writeMarkdownFile was called with updated markdown syntax [-]
    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalled();
      const lastCallArg = vi
        .mocked(fileService.writeMarkdownFile)
        .mock.calls.slice(-1)[0][1];
      expect(lastCallArg).toContain("[-]");
    });
  });
});
