import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarTree, formatTreeDisplayName } from "../SidebarTree";
import { FileTreeNode } from "../../../types/workspaceTree";

describe("SidebarTree Component", () => {
  const sampleNodes: FileTreeNode[] = [
    {
      id: "folder-1",
      name: "Projects",
      path: "Projects",
      kind: "folder",
      children: [
        {
          id: "note-1",
          name: "client-a.md",
          path: "Projects/client-a.md",
          kind: "file",
        },
        {
          id: "dash-1",
          name: "overview.dashboard.md",
          path: "Projects/overview.dashboard.md",
          kind: "dashboard",
          isDashboard: true,
        },
      ],
    },
    {
      id: "note-2",
      name: "root-note.md",
      path: "root-note.md",
      kind: "file",
    },
  ];

  it("renders root nodes and distinct visual icons", () => {
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={vi.fn()}
      />
    );

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("root-note")).toBeInTheDocument();
    expect(screen.queryByText("root-note.md")).not.toBeInTheDocument();

    // Check icon indicators and flexShrink geometry
    const folderIcon = screen.getByTestId("icon-folder");
    const noteIcon = screen.getByTestId("icon-note");
    expect(folderIcon).toBeInTheDocument();
    expect(folderIcon).toHaveStyle({ flexShrink: "0" });
    expect(noteIcon).toBeInTheDocument();
    expect(noteIcon).toHaveStyle({ flexShrink: "0" });
  });

  it("expands and collapses folder nodes on click", () => {
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={vi.fn()}
      />
    );

    // Children are not visible initially before expand click
    expect(screen.queryByText("client-a")).not.toBeInTheDocument();

    // Click folder to expand
    fireEvent.click(screen.getByText("Projects"));

    expect(screen.getByText("client-a")).toBeInTheDocument();
    expect(screen.queryByText("client-a.md")).not.toBeInTheDocument();
    expect(screen.getByText("overview")).toBeInTheDocument();
    expect(screen.queryByText("overview.dashboard.md")).not.toBeInTheDocument();
    const dashIcon = screen.getByTestId("icon-dashboard");
    expect(dashIcon).toBeInTheDocument();
    expect(dashIcon).toHaveStyle({ flexShrink: "0" });

    // Click folder again to collapse
    fireEvent.click(screen.getByText("Projects"));
    expect(screen.queryByText("client-a")).not.toBeInTheDocument();
  });

  it("triggers onSelectFile when a note or dashboard item is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={handleSelect}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("root-note"));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ path: "root-note.md" })
    );
  });

  it("triggers action callbacks for rename, delete, and add item", () => {
    const handleRename = vi.fn();
    const handleDelete = vi.fn();
    const handleAddNote = vi.fn();

    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={handleAddNote}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={handleRename}
        onDelete={handleDelete}
        onMovePath={vi.fn()}
      />
    );

    const renameBtn = screen.getByTestId("node-rename-root-note.md");
    const deleteBtn = screen.getByTestId("node-delete-root-note.md");
    const addNoteBtn = screen.getByTestId("node-add-note-Projects");

    fireEvent.click(renameBtn);
    expect(handleRename).toHaveBeenCalledWith(
      expect.objectContaining({ path: "root-note.md" })
    );

    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(
      expect.objectContaining({ path: "root-note.md" })
    );

    fireEvent.click(addNoteBtn);
    expect(handleAddNote).toHaveBeenCalledWith("Projects");
  });

  it("handles drag-and-drop events calling onMovePath", () => {
    const handleMove = vi.fn();
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={handleMove}
      />
    );

    const noteNode = screen.getByTestId("tree-node-root-note.md");
    const folderNode = screen.getByTestId("tree-node-Projects");

    // Drag start
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("root-note.md"),
      dropEffect: "",
      effectAllowed: "",
    };

    fireEvent.dragStart(noteNode, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "text/plain",
      "root-note.md"
    );

    // Drop on folder
    fireEvent.drop(folderNode, { dataTransfer });
    expect(handleMove).toHaveBeenCalledWith("root-note.md", "Projects");
  });

  it("handles dragging task payload and dropping onto markdown file node in tree", () => {
    const handleMoveTaskToNote = vi.fn();
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={vi.fn()}
        onMoveTaskToNote={handleMoveTaskToNote}
      />
    );

    // Expand folder to see client-a.md
    fireEvent.click(screen.getByText("Projects"));

    const noteTarget = screen.getByTestId("tree-node-Projects/client-a.md");
    const taskPayload = JSON.stringify({
      taskTitle: "Set up Dual Column layout shell with Rosé Pine tokens",
      sourceFile: "root-note.md",
      priority: "urgent",
    });

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn((format: string) => {
        if (format === "application/json") return taskPayload;
        return "";
      }),
      types: ["application/json"],
      dropEffect: "",
      effectAllowed: "",
    };

    fireEvent.dragOver(noteTarget, { dataTransfer });
    fireEvent.drop(noteTarget, { dataTransfer });

    expect(handleMoveTaskToNote).toHaveBeenCalledWith(
      "Set up Dual Column layout shell with Rosé Pine tokens",
      "root-note.md",
      "Projects/client-a.md",
      "urgent"
    );
  });

  it("handles dropping an item onto V-Folder root drop zone", () => {
    const handleMove = vi.fn();
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={handleMove}
      />
    );

    const container = screen.getByTestId("sidebar-tree-container");
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("Projects/client-a.md"),
      dropEffect: "",
      effectAllowed: "",
    };

    fireEvent.dragOver(container, { dataTransfer });
    expect(screen.getByTestId("root-drop-zone")).toBeInTheDocument();

    fireEvent.drop(container, { dataTransfer });
    expect(handleMove).toHaveBeenCalledWith("Projects/client-a.md", "");
  });

  it("prevents moving a parent folder into its own descendant folder", () => {
    const handleMove = vi.fn();
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={handleMove}
      />
    );

    fireEvent.click(screen.getByText("Projects"));
    const childNode = screen.getByTestId("tree-node-Projects/client-a.md");

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("Projects"),
      dropEffect: "",
      effectAllowed: "",
    };

    fireEvent.drop(childNode, { dataTransfer });
    // Projects -> Projects/client-a.md parent is Projects, sourcePath === targetDir, so no move call
    expect(handleMove).not.toHaveBeenCalled();
  });

  it("applies active highlight styling when activeFilePath matches node path", () => {
    render(
      <SidebarTree
        nodes={sampleNodes}
        activeFilePath="root-note.md"
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={vi.fn()}
      />
    );

    const activeNode = screen.getByTestId("tree-node-root-note.md");
    expect(activeNode).toHaveStyle({
      backgroundColor: "rgba(235, 111, 146, 0.18)",
    });
  });

  it("rejects dropping a completed task onto a sidebar note file and leaves source intact", () => {
    const handleMoveTaskToNote = vi.fn();
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={vi.fn()}
        onMoveTaskToNote={handleMoveTaskToNote}
      />
    );

    // Expand folder to see client-a.md
    fireEvent.click(screen.getByText("Projects"));

    const noteTarget = screen.getByTestId("tree-node-Projects/client-a.md");
    const completedTaskPayload = JSON.stringify({
      taskTitle: "Completed archived task",
      sourceFile: "root-note.md",
      state: "completed",
    });

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn((format: string) => {
        if (format === "application/json") return completedTaskPayload;
        if (format === "text/plain") return "task-drag:Completed archived task";
        return "";
      }),
      types: ["application/json", "text/plain"],
      dropEffect: "",
      effectAllowed: "",
    };

    fireEvent.dragOver(noteTarget, { dataTransfer });
    fireEvent.drop(noteTarget, { dataTransfer });

    // Must NOT call onMoveTaskToNote for completed tasks
    expect(handleMoveTaskToNote).not.toHaveBeenCalled();
  });

  it("allows dropping an in-progress or open task onto a sidebar note file", () => {
    const handleMoveTaskToNote = vi.fn();
    render(
      <SidebarTree
        nodes={sampleNodes}
        onSelectFile={vi.fn()}
        onCreateNote={vi.fn()}
        onCreateFolder={vi.fn()}
        onCreateDashboard={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMovePath={vi.fn()}
        onMoveTaskToNote={handleMoveTaskToNote}
      />
    );

    fireEvent.click(screen.getByText("Projects"));

    const noteTarget = screen.getByTestId("tree-node-Projects/client-a.md");
    const openTaskPayload = JSON.stringify({
      taskTitle: "Active in-progress task",
      sourceFile: "root-note.md",
      state: "in_progress",
      priority: "high",
    });

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn((format: string) => {
        if (format === "application/json") return openTaskPayload;
        if (format === "text/plain") return "task-drag:Active in-progress task";
        return "";
      }),
      types: ["application/json", "text/plain"],
      dropEffect: "",
      effectAllowed: "",
    };

    fireEvent.dragOver(noteTarget, { dataTransfer });
    fireEvent.drop(noteTarget, { dataTransfer });

    expect(handleMoveTaskToNote).toHaveBeenCalledWith(
      "Active in-progress task",
      "root-note.md",
      "Projects/client-a.md",
      "high"
    );
  });

  describe("Extension masking & Icon geometry", () => {
    it("formatTreeDisplayName masks .md and .dashboard.md but preserves non-markdown files and folders", () => {
      expect(formatTreeDisplayName("meeting.md", "file")).toBe("meeting");
      expect(formatTreeDisplayName("notes.MD", "file")).toBe("notes");
      expect(formatTreeDisplayName("projects.dashboard.md", "dashboard")).toBe(
        "projects"
      );
      expect(formatTreeDisplayName("projects.DASHBOARD.MD", "dashboard")).toBe(
        "projects"
      );
      expect(formatTreeDisplayName("archive.zip", "file")).toBe("archive.zip");
      expect(formatTreeDisplayName("image.png", "file")).toBe("image.png");
      expect(formatTreeDisplayName("folder.md", "folder")).toBe("folder.md");
      expect(formatTreeDisplayName(".md", "file")).toBe(".md");
      expect(formatTreeDisplayName(".dashboard.md", "file")).toBe(
        ".dashboard.md"
      );
    });

    it("renders non-markdown files with full extension intact and locks icon geometry for long names", () => {
      const longNameNodes: FileTreeNode[] = [
        {
          id: "long-note",
          name: "extremely-long-architectural-decision-record-for-vault-v2-features.md",
          path: "extremely-long-architectural-decision-record-for-vault-v2-features.md",
          kind: "file",
        },
        {
          id: "data-file",
          name: "metrics-data.json",
          path: "metrics-data.json",
          kind: "file",
        },
      ];

      render(
        <SidebarTree
          nodes={longNameNodes}
          onSelectFile={vi.fn()}
          onCreateNote={vi.fn()}
          onCreateFolder={vi.fn()}
          onCreateDashboard={vi.fn()}
          onRename={vi.fn()}
          onDelete={vi.fn()}
          onMovePath={vi.fn()}
        />
      );

      // Long markdown note should be masked without .md
      expect(
        screen.getByText(
          "extremely-long-architectural-decision-record-for-vault-v2-features"
        )
      ).toBeInTheDocument();

      // Non-markdown file retains full filename
      expect(screen.getByText("metrics-data.json")).toBeInTheDocument();

      // Verify icons are present with flex-shrink: 0
      const noteIcons = screen.getAllByTestId("icon-note");
      expect(noteIcons.length).toBe(2);
      noteIcons.forEach((icon) => {
        expect(icon).toHaveStyle({ flexShrink: "0" });
      });

      // Verify label container styling for truncation
      const labelText = screen.getByText(
        "extremely-long-architectural-decision-record-for-vault-v2-features"
      );
      expect(labelText).toHaveStyle({
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flex: "1 1 0%",
      });
    });
  });
});
