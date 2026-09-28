import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DualColumnLayout } from "../DualColumnLayout";
import * as fileService from "../../../services/fileService";
import {
  clearSession,
  saveSession,
  loadSession,
} from "../../../services/sessionService";

vi.mock("../../../services/fileService", async () => {
  const actual = await vi.importActual<typeof fileService>(
    "../../../services/fileService"
  );
  return {
    ...actual,
    readMarkdownFile: vi.fn(actual.readMarkdownFile),
    writeMarkdownFile: vi.fn(actual.writeMarkdownFile),
    createFolder: vi.fn(actual.createFolder),
  };
});

describe("DualColumnLayout Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    localStorage.clear();
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
      expect(screen.getByTestId("sidebar-container")).toBeInTheDocument();
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
    const noteHeader = screen.getByTestId(
      "task-tree-note-Projects/Lucky Draw.md"
    );
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

  it("manages themeMode state and toggles mode between working and arcade", async () => {
    render(<DualColumnLayout />);

    const toggleBtn = screen.getByTestId("theme-mode-toggle-btn");
    expect(toggleBtn).toBeInTheDocument();
    const initialText = toggleBtn.textContent;

    fireEvent.click(toggleBtn);

    await waitFor(() => {
      const updatedText = screen.getByTestId(
        "theme-mode-toggle-btn"
      ).textContent;
      expect(updatedText).not.toBe(initialText);
    });
  });

  it("opens Quick Switcher when pressing Ctrl+P and switches active note on selection", async () => {
    fileService.setMockFileContent("first-note.md", "# First Note Content");
    fileService.setMockFileContent(
      "workspace/docs/second-note.md",
      "# Second Note Content"
    );

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByTestId("editor-contenteditable")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("quick-switcher-modal")).toBeNull();

    // 1. Press Ctrl+P to open Quick Switcher
    fireEvent.keyDown(window, { key: "p", ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("quick-switcher-modal")).toBeInTheDocument();
      expect(screen.getByTestId("quick-switcher-input")).toBeInTheDocument();
    });

    // 2. Type query to filter
    const input = screen.getByTestId("quick-switcher-input");
    fireEvent.change(input, { target: { value: "second" } });

    await waitFor(() => {
      expect(screen.getByText("second-note.md")).toBeInTheDocument();
    });

    // 3. Press Enter to select
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.queryByTestId("quick-switcher-modal")).toBeNull();
      expect(screen.getByText("Second Note Content")).toBeInTheDocument();
    });
  });

  it("creates a new Note in the active folder when pressing Ctrl+N and opens it for editing", async () => {
    fileService.setMockFileContent(
      "workspace/docs/guide.md",
      "# Guide Note Content"
    );

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByText("Guide Note Content")).toBeInTheDocument();
    });

    // Press Ctrl+N to create new note in active directory (workspace/docs)
    fireEvent.keyDown(window, { key: "n", ctrlKey: true });

    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "workspace/docs/Untitled.md",
        expect.stringContaining("# Untitled")
      );
    });

    // If Untitled.md already exists, Ctrl+N creates Untitled 1.md
    await act(async () => {
      fileService.setMockFileContent(
        "workspace/docs/Untitled.md",
        "# Untitled\n\n"
      );
    });

    fireEvent.keyDown(window, { key: "n", ctrlKey: true });

    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "workspace/docs/Untitled 1.md",
        expect.stringContaining("# Untitled 1")
      );
    });
  });

  it("opens Quick Switcher when clicking search button in TitleBar", async () => {
    fileService.setMockFileContent("test-file.md", "# Test Content");

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByTestId("editor-contenteditable")).toBeInTheDocument();
    });

    const switcherBtn = screen.getByTestId("titlebar-quick-switcher-btn");
    fireEvent.click(switcherBtn);

    await waitFor(() => {
      expect(screen.getByTestId("quick-switcher-modal")).toBeInTheDocument();
    });
  });

  it("handles global shortcut triggers for note creation and quick switcher", async () => {
    let capturedHandlers: {
      onNewNote?: () => void | Promise<void>;
      onOpenQuickSwitcher?: () => void | Promise<void>;
    } | null = null;
    const registerSpy = vi
      .spyOn(
        await import("../../../services/globalShortcutService"),
        "registerGlobalShortcuts"
      )
      .mockImplementation(async (handlers) => {
        capturedHandlers = handlers;
        return async () => {};
      });

    fileService.setMockFileContent(
      "workspace/docs/root.md",
      "# Root Doc Content"
    );

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByText("Root Doc Content")).toBeInTheDocument();
      expect(capturedHandlers).not.toBeNull();
    });

    // 1. Trigger global shortcut for Quick Switcher
    await act(async () => {
      await capturedHandlers!.onOpenQuickSwitcher?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("quick-switcher-modal")).toBeInTheDocument();
    });

    // Close switcher
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByTestId("quick-switcher-modal")).toBeNull();
    });

    // 2. Trigger global shortcut for New Note
    await act(async () => {
      await capturedHandlers!.onNewNote?.();
    });

    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "workspace/docs/Untitled.md",
        expect.stringContaining("# Untitled")
      );
    });

    registerSpy.mockRestore();
  });

  it("opens Settings modal when clicking sidebar settings button and changes theme", async () => {
    fileService.setMockFileContent("test.md", "# Test Note");

    render(<DualColumnLayout />);

    const settingsBtn = screen.getByTestId("sidebar-settings-btn");
    expect(settingsBtn).toBeInTheDocument();

    fireEvent.click(settingsBtn);

    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
    expect(screen.getByText("Vault Settings")).toBeInTheDocument();

    // Switch theme to Nord
    fireEvent.click(screen.getByTestId("theme-option-nord"));
    expect(document.documentElement.dataset.theme).toBe("nord");

    // Close settings modal
    fireEvent.click(screen.getByTestId("settings-close-btn"));
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  it("toggles Split View dual-pane layout via Ctrl+\\ shortcut", async () => {
    fileService.setMockFileContent("note-left.md", "# Left Note");
    fileService.setMockFileContent("note-right.md", "# Right Note");

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByTestId("split-view-left-pane")).toBeInTheDocument();
    });

    // Initially single pane
    expect(
      screen.queryByTestId("split-view-right-pane")
    ).not.toBeInTheDocument();

    // Trigger Ctrl+\
    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });

    // Both left and right panes appear with divider
    await waitFor(() => {
      expect(screen.getByTestId("split-view-left-pane")).toBeInTheDocument();
      expect(screen.getByTestId("split-view-right-pane")).toBeInTheDocument();
      expect(screen.getByTestId("split-view-divider")).toBeInTheDocument();
    });

    // Toggle off with Ctrl+\
    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });
    await waitFor(() => {
      expect(
        screen.queryByTestId("split-view-right-pane")
      ).not.toBeInTheDocument();
    });
  });

  it("toggles Split View via Note Action Bar button and closes via close button", async () => {
    fileService.setMockFileContent("main-note.md", "# Main Note Content");
    fileService.setMockFileContent("secondary-note.md", "# Secondary Note");

    render(<DualColumnLayout />);

    const splitBtn = await screen.findByTestId("note-action-split-right");
    expect(splitBtn).toBeInTheDocument();

    // Click split button
    fireEvent.click(splitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("split-view-right-pane")).toBeInTheDocument();
    });

    // Close button appears in right pane
    const closeBtn = screen.getByTestId("close-split-pane-btn");
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(
        screen.queryByTestId("split-view-right-pane")
      ).not.toBeInTheDocument();
    });
  });

  it("opens file in split right pane when clicking split action in sidebar", async () => {
    fileService.setMockFileContent("first.md", "# First Note");
    fileService.setMockFileContent("second.md", "# Second Note");

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByTestId("tree-node-second.md")).toBeInTheDocument();
    });

    const splitNodeBtn = screen.getByTestId("node-split-second.md");
    fireEvent.click(splitNodeBtn);

    await waitFor(() => {
      expect(screen.getByTestId("split-view-right-pane")).toBeInTheDocument();
      expect(screen.getByText("Second Note")).toBeInTheDocument();
    });
  });

  it("renders Split View Divider with grip handle, ambient pane focus bar, and supports dragging", async () => {
    fileService.setMockFileContent("left-note.md", "# Left Pane Note");
    fileService.setMockFileContent("right-note.md", "# Right Pane Note");

    render(<DualColumnLayout />);

    const splitBtn = await screen.findByTestId("note-action-split-right");
    fireEvent.click(splitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("split-view-divider")).toBeInTheDocument();
      expect(screen.getByTestId("split-view-right-pane")).toBeInTheDocument();
    });

    const divider = screen.getByTestId("split-view-divider");
    const grip = screen.getByTestId("split-view-divider-grip");
    const leftPane = screen.getByTestId("split-view-left-pane");
    const rightPane = screen.getByTestId("split-view-right-pane");

    expect(divider).toBeInTheDocument();
    expect(grip).toBeInTheDocument();
    expect(grip).toHaveTextContent("⋮⋮");

    // Right pane is initially focused on split open
    expect(rightPane.style.borderTop).toBe("2px solid var(--rose-pink)");

    // Click left pane to shift focus
    fireEvent.click(leftPane);
    expect(leftPane.style.borderTop).toBe("2px solid var(--rose-pink)");
    expect(rightPane.style.borderTop).toBe("2px solid transparent");

    // Click right pane to shift focus back
    fireEvent.click(rightPane);
    expect(rightPane.style.borderTop).toBe("2px solid var(--rose-pink)");
    expect(leftPane.style.borderTop).toBe("2px solid transparent");

    // Mouse down on divider and drag
    fireEvent.mouseDown(divider);
    fireEvent.mouseMove(window, { clientX: 300 });
    fireEvent.mouseUp(window);
  });

  it("opens FileOperationModal preset to create-folder with active note parent directory when Ctrl+Shift+N is pressed", async () => {
    fileService.setMockFileContent(
      "workspace/docs/guide.md",
      "# Guide Note Content"
    );

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByText("Guide Note Content")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("file-operation-modal")).toBeNull();

    // Trigger Ctrl+Shift+N
    fireEvent.keyDown(window, { key: "N", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("file-operation-modal")).toBeInTheDocument();
      expect(screen.getByText("Create New Folder")).toBeInTheDocument();
      expect(screen.getByText("Target: workspace/docs")).toBeInTheDocument();
      expect(screen.getByTestId("file-operation-input")).toBeInTheDocument();
    });

    // Confirm creating folder
    const input = screen.getByTestId("file-operation-input");
    fireEvent.change(input, { target: { value: "components" } });
    fireEvent.click(screen.getByTestId("modal-submit-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("file-operation-modal")).toBeNull();
      expect(fileService.createFolder).toHaveBeenCalledWith(
        "workspace/docs/components"
      );
    });
  });

  it("targets workspace root when Ctrl+Shift+N is pressed and active note is at root level", async () => {
    fileService.setMockFileContent("root-file.md", "# Root File");

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByText("Root File")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "n", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("file-operation-modal")).toBeInTheDocument();
      expect(screen.getByText("Create New Folder")).toBeInTheDocument();
      expect(screen.getByText("Target: workspace")).toBeInTheDocument();
    });
  });

  it("targets parent directory when a folder is selected and Ctrl+Shift+N is pressed", async () => {
    fileService.setMockFileContent("Projects/sub/note.md", "# Subfolder Note");

    render(<DualColumnLayout />);

    // Expand Projects folder in tree
    const projectsFolder = await screen.findByTestId("tree-node-Projects");
    fireEvent.click(projectsFolder);

    // Click subfolder
    const subFolder = await screen.findByTestId("tree-node-Projects/sub");
    fireEvent.click(subFolder);

    // Trigger Cmd+Shift+N (macOS shortcut variant)
    fireEvent.keyDown(window, { key: "N", metaKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("file-operation-modal")).toBeInTheDocument();
      expect(screen.getByText("Target: Projects")).toBeInTheDocument();
    });
  });

  it("ensures Ctrl+Shift+N does not conflict with Ctrl+N note creation or Ctrl+P quick switcher", async () => {
    fileService.setMockFileContent(
      "workspace/docs/guide.md",
      "# Guide Note Content"
    );

    render(<DualColumnLayout />);

    await waitFor(() => {
      expect(screen.getByText("Guide Note Content")).toBeInTheDocument();
    });

    // 1. Pressing Ctrl+Shift+N opens folder modal and does NOT call writeMarkdownFile for Untitled note
    fireEvent.keyDown(window, { key: "n", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId("file-operation-modal")).toBeInTheDocument();
    });
    expect(fileService.writeMarkdownFile).not.toHaveBeenCalledWith(
      expect.stringContaining("Untitled"),
      expect.any(String)
    );

    // Close folder modal
    fireEvent.click(screen.getByTestId("modal-cancel-btn"));
    await waitFor(() => {
      expect(screen.queryByTestId("file-operation-modal")).toBeNull();
    });

    // 2. Pressing Ctrl+N still creates a note as before
    fireEvent.keyDown(window, { key: "n", ctrlKey: true, shiftKey: false });
    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "workspace/docs/Untitled.md",
        expect.stringContaining("# Untitled")
      );
    });

    // 3. Pressing Ctrl+P still opens quick switcher without opening folder modal
    fireEvent.keyDown(window, { key: "p", ctrlKey: true, shiftKey: false });
    await waitFor(() => {
      expect(screen.getByTestId("quick-switcher-modal")).toBeInTheDocument();
      expect(screen.queryByTestId("file-operation-modal")).toBeNull();
    });
  });

  describe("Workspace Session Persistence", () => {
    it("restores saved session state on mount (active note, split view, ratio, sidebar, filters)", async () => {
      fileService.setMockFileContent("note-a.md", "# Note A");
      fileService.setMockFileContent(
        "note-b.md",
        "# Note B Content\n\n- [ ] Task in B"
      );
      fileService.setMockFileContent(
        "note-c.md",
        "# Note C Content\n\n- [-] In Progress Task"
      );

      saveSession(
        {
          activeFilename: "note-b.md",
          isSplitView: true,
          rightFilename: "note-c.md",
          splitRatio: 0.6,
          isSidebarCollapsed: false,
          sidebarWidth: 350,
          activeFilter: "in_progress",
          activeTagFilter: null,
        },
        true
      );

      render(<DualColumnLayout />);

      // Left pane should have restored note-b
      await waitFor(() => {
        expect(screen.getByText("Note B Content")).toBeInTheDocument();
      });

      // Split view right pane should be restored with note-c
      await waitFor(() => {
        expect(screen.getByTestId("split-view-right-pane")).toBeInTheDocument();
        expect(screen.getByText("Note C Content")).toBeInTheDocument();
      });

      // Split view divider should be present
      expect(screen.getByTestId("split-view-divider")).toBeInTheDocument();

      // Sidebar container width should reflect saved width
      const sidebar = screen.getByTestId("sidebar-container");
      expect(sidebar.style.width).toBe("350px");

      // Verify task filter restored to in_progress in sidebar
      fireEvent.click(screen.getByTestId("tab-tasks"));
      await waitFor(() => {
        const filterBtn = screen.getByTestId("filter-btn-in_progress");
        expect(filterBtn).toBeInTheDocument();
      });
    });

    it("gracefully prunes deleted notes from session and falls back without throwing", async () => {
      fileService.setMockFileContent(
        "existing-note.md",
        "# Existing Note Content"
      );

      // Session references files that no longer exist
      saveSession(
        {
          activeFilename: "missing-active.md",
          isSplitView: true,
          rightFilename: "missing-right.md",
        },
        true
      );

      render(<DualColumnLayout />);

      // Should fall back to existing-note.md for active note
      await waitFor(() => {
        expect(screen.getByText("Existing Note Content")).toBeInTheDocument();
      });

      // Right pane should show empty state gracefully
      await waitFor(() => {
        expect(screen.getByTestId("split-view-right-pane")).toBeInTheDocument();
        expect(
          screen.getByText("No file selected in split view")
        ).toBeInTheDocument();
      });

      // Pruned session should be updated in localStorage
      await waitFor(() => {
        const session = loadSession();
        expect(session.activeFilename).toBe("existing-note.md");
        expect(session.rightFilename).toBeNull();
      });
    });

    it("persists user interactions to localStorage with debouncing", async () => {
      fileService.setMockFileContent("doc1.md", "# Document One Content");
      fileService.setMockFileContent("doc2.md", "# Document Two Content");

      render(<DualColumnLayout />);

      await waitFor(() => {
        expect(screen.getByText("Document One Content")).toBeInTheDocument();
      });

      // Select doc2 from tree
      const doc2Node = await screen.findByTestId("tree-node-doc2.md");
      fireEvent.click(doc2Node);

      await waitFor(() => {
        expect(screen.getByText("Document Two Content")).toBeInTheDocument();
      });

      // Verify active note persistence
      await waitFor(
        () => {
          const session = loadSession();
          expect(session.activeFilename).toBe("doc2.md");
        },
        { timeout: 1000 }
      );

      // Collapse sidebar
      const collapseBtn = screen.getByTestId("sidebar-collapse-btn");
      fireEvent.click(collapseBtn);

      await waitFor(
        () => {
          const session = loadSession();
          expect(session.isSidebarCollapsed).toBe(true);
        },
        { timeout: 1000 }
      );

      // Expand sidebar
      const expandBtn = screen.getByTestId("sidebar-expand-btn");
      expect(expandBtn).toBeInTheDocument();
      fireEvent.click(expandBtn);

      await waitFor(
        () => {
          const session = loadSession();
          expect(session.isSidebarCollapsed).toBe(false);
        },
        { timeout: 1000 }
      );
    });
  });
});
