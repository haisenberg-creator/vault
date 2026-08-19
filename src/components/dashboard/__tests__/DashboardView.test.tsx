import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardView } from "../DashboardView";
import { WorkspaceFile } from "../../../services/fileService";
import * as fileService from "../../../services/fileService";

vi.mock("../../../services/fileService", async () => {
  const actual = await vi.importActual<
    typeof import("../../../services/fileService")
  >("../../../services/fileService");
  return {
    ...actual,
    writeMarkdownFile: vi.fn().mockResolvedValue(undefined),
    readMarkdownFile: vi.fn().mockResolvedValue(""),
  };
});

// Mock EditorPane to avoid initializing Lexical composer overhead in component unit tests
vi.mock("../../editor/EditorPane", () => ({
  EditorPane: ({ filename }: { filename: string }) => (
    <div data-testid="mock-editor-pane">Editor for {filename}</div>
  ),
}));

describe("DashboardView Component", () => {
  const mockWorkspaceFiles: WorkspaceFile[] = [
    {
      path: "Projects/overview.dashboard.md",
      name: "overview.dashboard.md",
      content: `---
type: dashboard
title: Project Overview Dashboard
sections:
  - id: sec-1
    title: Active Work
    filter:
      state: [open, in_progress]
      folder: "Projects"
      recursive: true
    groupBy: folder
  - id: sec-2
    title: Urgent Bugs
    filter:
      tags: ["#bug"]
---`,
    },
    {
      path: "Projects/Client-A/TaskNote.md",
      name: "TaskNote.md",
      content: `# Client A Tasks
- [ ] Implement user login #bug
- [-] Fix database connection leak
- [x] Write project documentation
`,
    },
    {
      path: "Notes/General.md",
      name: "General.md",
      content: `- [>] Upgrade system dependencies #bug`,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header with dashboard title, section count, and total tasks for root dashboard", () => {
    render(
      <DashboardView
        filePath="overview.dashboard.md"
        workspaceFiles={mockWorkspaceFiles}
      />
    );

    expect(screen.getByTestId("dashboard-title")).toHaveTextContent(
      "Project Overview Dashboard"
    );
    expect(screen.getByText("2 Sections")).toBeInTheDocument();
    expect(screen.getByText("4 Total Tasks")).toBeInTheDocument();
  });

  it("scopes dashboard aggregation to containing folder when in a subfolder", () => {
    render(
      <DashboardView
        filePath="Projects/overview.dashboard.md"
        workspaceFiles={mockWorkspaceFiles}
      />
    );

    expect(screen.getByText("3 Total Tasks")).toBeInTheDocument();
  });

  it("renders multi-section widget grid in interactive view mode", () => {
    render(
      <DashboardView
        filePath="Projects/overview.dashboard.md"
        workspaceFiles={mockWorkspaceFiles}
      />
    );

    expect(screen.getByTestId("interactive-widget-grid")).toBeInTheDocument();
    expect(screen.getByTestId("section-widget-sec-1")).toBeInTheDocument();
    expect(screen.getByTestId("section-widget-sec-2")).toBeInTheDocument();
    expect(screen.getByText("Active Work")).toBeInTheDocument();
    expect(screen.getByText("Urgent Bugs")).toBeInTheDocument();
  });

  it("toggles between Interactive View and Raw YAML Source mode", () => {
    render(
      <DashboardView
        filePath="Projects/overview.dashboard.md"
        workspaceFiles={mockWorkspaceFiles}
      />
    );

    // Default: Interactive View
    expect(screen.getByTestId("interactive-widget-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-editor-pane")).not.toBeInTheDocument();

    // Switch to Raw Source mode
    const rawBtn = screen.getByTestId("mode-raw-btn");
    fireEvent.click(rawBtn);

    expect(
      screen.queryByTestId("interactive-widget-grid")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-editor-pane")).toBeInTheDocument();

    // Switch back to Interactive View
    const interactiveBtn = screen.getByTestId("mode-interactive-btn");
    fireEvent.click(interactiveBtn);

    expect(screen.getByTestId("interactive-widget-grid")).toBeInTheDocument();
  });

  it("invokes onSelectFile when clicking source file link on a task", () => {
    const handleSelectFile = vi.fn();
    render(
      <DashboardView
        filePath="Projects/overview.dashboard.md"
        workspaceFiles={mockWorkspaceFiles}
        onSelectFile={handleSelectFile}
      />
    );

    const fileLinks = screen.getAllByTestId(
      "source-file-link-Projects/Client-A/TaskNote.md:1:Implement user login #bug"
    );
    fireEvent.click(fileLinks[0]);

    expect(handleSelectFile).toHaveBeenCalledWith(
      "Projects/Client-A/TaskNote.md"
    );
  });

  it("mutates source markdown file on disk when toggling task state", async () => {
    const handleRefresh = vi.fn();
    render(
      <DashboardView
        filePath="Projects/overview.dashboard.md"
        workspaceFiles={mockWorkspaceFiles}
        onRefreshWorkspace={handleRefresh}
      />
    );

    const toggleBtns = screen.getAllByTestId(
      "toggle-task-Projects/Client-A/TaskNote.md:1:Implement user login #bug"
    );
    fireEvent.click(toggleBtns[0]);

    await waitFor(() => {
      expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
        "Projects/Client-A/TaskNote.md",
        expect.stringContaining("- [-] Implement user login #bug")
      );
      expect(handleRefresh).toHaveBeenCalled();
    });
  });

  it("filters dashboard sections by activeTagFilter and displays dismissible tag banner", () => {
    const handleClear = vi.fn();
    render(
      <DashboardView
        filePath="Projects/overview.dashboard.md"
        workspaceFiles={mockWorkspaceFiles}
        activeTagFilter="#bug"
        onClearTagFilter={handleClear}
      />
    );

    const banner = screen.getByTestId("dashboard-tag-filter-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent("Filtered by tag:");
    expect(banner).toHaveTextContent("#bug");

    // Click clear button
    const clearBtn = screen.getByTestId("clear-dashboard-tag-filter-btn");
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);

    // Only tasks with #bug should be in sections
    expect(
      screen.getAllByText("Implement user login #bug").length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Fix database connection leak")
    ).not.toBeInTheDocument();
  });
});
