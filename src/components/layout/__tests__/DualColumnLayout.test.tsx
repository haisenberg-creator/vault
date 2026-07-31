import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DualColumnLayout } from "../DualColumnLayout";
import * as fileService from "../../../services/fileService";

vi.mock("../../../services/fileService", async () => {
  const actual = await vi.importActual<typeof fileService>(
    "../../../services/fileService"
  );
  return {
    ...actual,
    readMarkdownFile: vi.fn(actual.readMarkdownFile),
    writeMarkdownFile: vi.fn(actual.writeMarkdownFile),
  };
});

describe("DualColumnLayout Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileService.clearMockStorage();
  });

  it("extracts tasks from markdown file and displays them in sidebar", async () => {
    const mockMarkdown = `# Project Plan

- [ ] Task Open Feature
- [-] Task In Progress Feature
- [x] Task Completed Feature
`;
    fileService.setMockFileContent("test-note.md", mockMarkdown);

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

  it("aggregates tasks across multiple distinct workspace notes", async () => {
    const activeNoteContent = `- [ ] Active Note Task`;
    const secondaryNoteContent = `- [>] Secondary Note Blocked Task\n- [x] Secondary Note Done Task`;

    fileService.setMockFileContent("active-note.md", activeNoteContent);
    fileService.setMockFileContent("secondary-note.md", secondaryNoteContent);

    render(<DualColumnLayout filename="active-note.md" />);

    await waitFor(() => {
      expect(screen.getByText("Active Note Task")).toBeInTheDocument();
      expect(
        screen.getByText("Secondary Note Blocked Task")
      ).toBeInTheDocument();
      expect(screen.getByText("Secondary Note Done Task")).toBeInTheDocument();
    });

    // Check sourceFile badges in sidebar
    expect(screen.getAllByText("active-note.md").length).toBeGreaterThan(0);
    expect(screen.getAllByText("secondary-note.md")).toHaveLength(2);
  });

  it("toggles task state in editor when clicked in sidebar", async () => {
    const mockMarkdown = `- [ ] Sync task from sidebar\n`;
    fileService.setMockFileContent("sync-note.md", mockMarkdown);

    render(<DualColumnLayout filename="sync-note.md" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading document...")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getAllByText("Sync task from sidebar").length
      ).toBeGreaterThan(0);
    });

    const taskItem = await screen.findByTestId(/^sidebar-task-item-/);
    expect(taskItem).toHaveAttribute("data-task-state", "open");

    // Click task in sidebar to toggle state from open -> in_progress
    fireEvent.click(taskItem);

    await waitFor(
      async () => {
        const updatedTaskItem =
          await screen.findByTestId(/^sidebar-task-item-/);
        expect(updatedTaskItem).toHaveAttribute(
          "data-task-state",
          "in_progress"
        );
      },
      { timeout: 1500 }
    );

    // Verify writeMarkdownFile was called with updated markdown syntax [-]
    await waitFor(
      () => {
        expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
          "sync-note.md",
          expect.stringContaining("[-]")
        );
      },
      { timeout: 1500 }
    );
  });

  it("toggles non-active workspace note task from sidebar", async () => {
    const activeNoteContent = `- [ ] Active Task`;
    const otherNoteContent = `- [ ] Other Note Task`;

    fileService.setMockFileContent("active-note.md", activeNoteContent);
    fileService.setMockFileContent("other-note.md", otherNoteContent);

    render(<DualColumnLayout filename="active-note.md" />);

    await waitFor(() => {
      expect(screen.getByText("Other Note Task")).toBeInTheDocument();
    });

    const otherTaskItem = screen
      .getByText("Other Note Task")
      .closest('[role="button"]')!;
    fireEvent.click(otherTaskItem);

    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "other-note.md",
        "- [-] Other Note Task"
      );
    });
  });
});
