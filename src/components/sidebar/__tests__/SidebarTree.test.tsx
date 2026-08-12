import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarTree } from "../SidebarTree";
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
    expect(screen.getByText("root-note.md")).toBeInTheDocument();

    // Check icon indicators
    expect(screen.getByTestId("icon-folder")).toBeInTheDocument();
    expect(screen.getByTestId("icon-note")).toBeInTheDocument();
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
    expect(screen.queryByText("client-a.md")).not.toBeInTheDocument();

    // Click folder to expand
    fireEvent.click(screen.getByText("Projects"));

    expect(screen.getByText("client-a.md")).toBeInTheDocument();
    expect(screen.getByText("overview.dashboard.md")).toBeInTheDocument();
    expect(screen.getByTestId("icon-dashboard")).toBeInTheDocument();

    // Click folder again to collapse
    fireEvent.click(screen.getByText("Projects"));
    expect(screen.queryByText("client-a.md")).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByText("root-note.md"));

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
});
