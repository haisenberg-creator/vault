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

    render(<DualColumnLayout />);

    // Switch to Tasks tab to test task dashboard functionality
    fireEvent.click(screen.getByTestId("tab-tasks"));

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

  it("defaults sidebar tab to Files & Folders tab on startup", async () => {
    render(<DualColumnLayout />);

    await waitFor(() => {
      const filesTab = screen.getByTestId("tab-files");
      expect(filesTab).toBeInTheDocument();
      expect(filesTab.style.borderBottom).toContain("solid");
    });
  });

  it("aggregates tasks across multiple distinct workspace notes", async () => {
    const activeNoteContent = `- [ ] Active Note Task`;
    const secondaryNoteContent = `- [>] Secondary Note Blocked Task\n- [x] Secondary Note Done Task`;

    fileService.setMockFileContent("active-note.md", activeNoteContent);
    fileService.setMockFileContent("secondary-note.md", secondaryNoteContent);

    render(<DualColumnLayout />);
    fireEvent.click(screen.getByTestId("tab-tasks"));

    await waitFor(() => {
      expect(screen.getByText("Active Note Task")).toBeInTheDocument();
      expect(
        screen.getByText("Secondary Note Blocked Task")
      ).toBeInTheDocument();
      expect(screen.getByText("Secondary Note Done Task")).toBeInTheDocument();
    });
  });

  it("toggles task state in editor when clicked in sidebar", async () => {
    const mockMarkdown = `- [ ] Sync task from sidebar\n`;
    fileService.setMockFileContent("sync-note.md", mockMarkdown);

    render(<DualColumnLayout />);
    fireEvent.click(screen.getByTestId("tab-tasks"));

    // Wait for editor to fully mount (auto-select picks the file)
    await waitFor(() => {
      expect(screen.getByTestId("editor-contenteditable")).toBeInTheDocument();
    });

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

    render(<DualColumnLayout />);
    fireEvent.click(screen.getByTestId("tab-tasks"));

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

  it("resolves subfolder note content and tasks without displaying New Note template", async () => {
    const subfolderNoteContent = `# Lucky Draw Project\n\n- [ ] Subfolder Task Item`;
    fileService.setMockFileContent(
      "Projects/Lucky Draw.md",
      subfolderNoteContent
    );

    render(<DualColumnLayout />);
    fireEvent.click(screen.getByTestId("tab-tasks"));

    await waitFor(() => {
      expect(screen.getByText("Subfolder Task Item")).toBeInTheDocument();
    });

    // Click on the subfolder note in the task tree to select it
    const noteHeader = screen.getByText("📄 Lucky Draw.md");
    fireEvent.click(noteHeader);

    // Verify the editor loads the actual content and does NOT display "New Note"
    await waitFor(() => {
      expect(screen.getByText("Lucky Draw Project")).toBeInTheDocument();
      expect(screen.queryByText(/New Note/i)).not.toBeInTheDocument();
    });
  });

  it("removes task from active source note on disk and appends to target note when moved", async () => {
    const activeNoteContent = `- [ ] Active Task To Move\n- [ ] Keep In Active`;
    const targetNoteContent = `# Target Note\n- [ ] Existing Target Task`;

    fileService.setMockFileContent("active-note.md", activeNoteContent);
    fileService.setMockFileContent("target-note.md", targetNoteContent);

    render(<DualColumnLayout />);

    // Wait for active note editor to load
    await waitFor(() => {
      expect(screen.getByTestId("editor-contenteditable")).toBeInTheDocument();
    });

    const targetNode = await screen.findByTestId("tree-node-target-note.md");
    const taskPayload = JSON.stringify({
      taskTitle: "Active Task To Move",
      sourceFile: "active-note.md",
      priority: "high",
    });

    const dataTransfer = {
      getData: (format: string) => {
        if (format === "application/json") return taskPayload;
        if (format === "text/plain") return "task-drag:Active Task To Move";
        return "";
      },
    };

    fireEvent.drop(targetNode, { dataTransfer });

    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "active-note.md",
        expect.not.stringContaining("Active Task To Move")
      );
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "target-note.md",
        expect.stringContaining("Active Task To Move")
      );
    });
  });

  it("scopes Tasks tab count to active open note and updates when switching notes", async () => {
    const note1Content = `# Note 1\n\n- [ ] Task 1A\n- [ ] Task 1B\n`;
    const note2Content = `# Note 2\n\n- [ ] Task 2A\n- [ ] Task 2B\n- [ ] Task 2C\n`;

    fileService.setMockFileContent("note1.md", note1Content);
    fileService.setMockFileContent("note2.md", note2Content);

    render(<DualColumnLayout />);

    // By default, note1.md is selected (first file in mock storage)
    await waitFor(() => {
      expect(screen.getByTestId("editor-contenteditable")).toBeInTheDocument();
    });

    // Check Tasks tab button label reflects Note 1's 2 tasks
    await waitFor(() => {
      expect(screen.getByTestId("tab-tasks")).toHaveTextContent("Tasks (2)");
    });

    // Switch to note2.md
    const note2TreeItem = await screen.findByTestId("tree-node-note2.md");
    fireEvent.click(note2TreeItem);

    // Check Tasks tab button label updates immediately to Note 2's 3 tasks
    await waitFor(() => {
      expect(screen.getByTestId("tab-tasks")).toHaveTextContent("Tasks (3)");
    });

    // When switching to Tasks tab, all 5 tasks across the vault remain present
    fireEvent.click(screen.getByTestId("tab-tasks"));
    await waitFor(() => {
      expect(screen.getByText("Task 1A")).toBeInTheDocument();
      expect(screen.getByText("Task 1B")).toBeInTheDocument();
      expect(screen.getByText("Task 2A")).toBeInTheDocument();
      expect(screen.getByText("Task 2B")).toBeInTheDocument();
      expect(screen.getByText("Task 2C")).toBeInTheDocument();
    });
  });
});
