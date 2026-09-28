import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExportArchiveModal } from "../ExportArchiveModal";
import { FileTreeNode } from "../../../types/workspaceTree";

describe("ExportArchiveModal", () => {
  const mockTree: FileTreeNode[] = [
    {
      id: "projects",
      name: "Projects",
      path: "Projects",
      kind: "folder",
      children: [
        {
          id: "projects/roadmap",
          name: "Roadmap.md",
          path: "Projects/Roadmap.md",
          kind: "file",
        },
        {
          id: "projects/tasks",
          name: "Tasks.dashboard.md",
          path: "Projects/Tasks.dashboard.md",
          kind: "dashboard",
          isDashboard: true,
        },
      ],
    },
    {
      id: "root-note",
      name: "Root.md",
      path: "Root.md",
      kind: "file",
    },
  ];

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ExportArchiveModal isOpen={false} onClose={vi.fn()} tree={mockTree} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders tree hierarchy with folders, notes, and dashboards with all selected by default", () => {
    render(
      <ExportArchiveModal isOpen={true} onClose={vi.fn()} tree={mockTree} />
    );

    expect(screen.getByTestId("export-archive-modal")).toBeInTheDocument();
    expect(screen.getByText("Export Vault Archive")).toBeInTheDocument();

    // Check items exist in tree
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Roadmap.md")).toBeInTheDocument();
    expect(screen.getByText("Tasks.dashboard.md")).toBeInTheDocument();
    expect(screen.getByText("Root.md")).toBeInTheDocument();

    // Live counter: 3 notes (2 files + 1 dashboard), 1 folder
    const counter = screen.getByTestId("export-modal-counter");
    expect(counter).toHaveTextContent("3 notes, 1 folder selected");

    // Master toggle button says Deselect All
    const toggleAllBtn = screen.getByTestId("export-modal-toggle-all");
    expect(toggleAllBtn).toHaveTextContent("Deselect All");

    // Export button is enabled
    const exportBtn = screen.getByTestId("export-modal-submit");
    expect(exportBtn).not.toBeDisabled();
  });

  it("toggles master Select All / Deselect All button", () => {
    render(
      <ExportArchiveModal isOpen={true} onClose={vi.fn()} tree={mockTree} />
    );

    const toggleAllBtn = screen.getByTestId("export-modal-toggle-all");
    const counter = screen.getByTestId("export-modal-counter");
    const exportBtn = screen.getByTestId("export-modal-submit");

    // Initially all selected -> click to Deselect All
    fireEvent.click(toggleAllBtn);
    expect(counter).toHaveTextContent("0 notes, 0 folders selected");
    expect(toggleAllBtn).toHaveTextContent("Select All");
    expect(exportBtn).toBeDisabled();

    // Click again to Select All
    fireEvent.click(toggleAllBtn);
    expect(counter).toHaveTextContent("3 notes, 1 folder selected");
    expect(toggleAllBtn).toHaveTextContent("Deselect All");
    expect(exportBtn).not.toBeDisabled();
  });

  it("checking/unchecking folder selects/unselects all descendant notes and dashboards", () => {
    render(
      <ExportArchiveModal isOpen={true} onClose={vi.fn()} tree={mockTree} />
    );

    // Deselect all first
    fireEvent.click(screen.getByTestId("export-modal-toggle-all"));
    expect(screen.getByTestId("export-modal-counter")).toHaveTextContent(
      "0 notes, 0 folders selected"
    );

    // Select Projects folder
    const folderCheckbox = screen.getByTestId("checkbox-Projects");
    fireEvent.click(folderCheckbox);

    // Both children should now be selected
    expect(screen.getByTestId("export-modal-counter")).toHaveTextContent(
      "2 notes, 1 folder selected"
    );

    const roadmapCheckbox = screen.getByTestId(
      "checkbox-Projects/Roadmap.md"
    ) as HTMLInputElement;
    const tasksCheckbox = screen.getByTestId(
      "checkbox-Projects/Tasks.dashboard.md"
    ) as HTMLInputElement;
    expect(roadmapCheckbox.checked).toBe(true);
    expect(tasksCheckbox.checked).toBe(true);

    // Unselect Projects folder
    fireEvent.click(folderCheckbox);
    expect(roadmapCheckbox.checked).toBe(false);
    expect(tasksCheckbox.checked).toBe(false);
    expect(screen.getByTestId("export-modal-counter")).toHaveTextContent(
      "0 notes, 0 folders selected"
    );
  });

  it("displays indeterminate state on parent folder when only some children are selected", () => {
    render(
      <ExportArchiveModal isOpen={true} onClose={vi.fn()} tree={mockTree} />
    );

    // Deselect all first
    fireEvent.click(screen.getByTestId("export-modal-toggle-all"));

    // Select only Roadmap.md
    const roadmapCheckbox = screen.getByTestId("checkbox-Projects/Roadmap.md");
    fireEvent.click(roadmapCheckbox);

    // Parent folder Projects should now be indeterminate
    const folderCheckbox = screen.getByTestId(
      "checkbox-Projects"
    ) as HTMLInputElement;
    expect(folderCheckbox.indeterminate).toBe(true);
    expect(folderCheckbox).toHaveAttribute("data-indeterminate", "true");
    expect(folderCheckbox).toHaveAttribute("aria-checked", "mixed");

    // Select the second child Tasks.dashboard.md
    const tasksCheckbox = screen.getByTestId(
      "checkbox-Projects/Tasks.dashboard.md"
    );
    fireEvent.click(tasksCheckbox);

    // Parent folder should now be fully checked (not indeterminate)
    expect(folderCheckbox.indeterminate).toBe(false);
    expect(folderCheckbox.checked).toBe(true);
    expect(folderCheckbox).toHaveAttribute("aria-checked", "true");
  });

  it("invokes onExport with selected file paths when clicking Export (.zip)", async () => {
    const onExportMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ExportArchiveModal
        isOpen={true}
        onClose={onCloseMock}
        tree={mockTree}
        onExport={onExportMock}
      />
    );

    // Deselect all and pick only Root.md
    fireEvent.click(screen.getByTestId("export-modal-toggle-all"));
    fireEvent.click(screen.getByTestId("checkbox-Root.md"));

    const exportBtn = screen.getByTestId("export-modal-submit");
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(onExportMock).toHaveBeenCalledWith(["Root.md"]);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it("handles keyboard accessibility (Escape to close, Enter to submit)", async () => {
    const onExportMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ExportArchiveModal
        isOpen={true}
        onClose={onCloseMock}
        tree={mockTree}
        onExport={onExportMock}
      />
    );

    // Press Escape -> onClose called
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    // Press Enter -> onExport called (since 3 notes are selected)
    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => {
      expect(onExportMock).toHaveBeenCalledTimes(1);
    });
  });

  it("supports Space key to toggle selection on treeitem", () => {
    render(
      <ExportArchiveModal isOpen={true} onClose={vi.fn()} tree={mockTree} />
    );

    // Root.md is initially checked
    const rootNode = screen.getByTestId("tree-node-Root.md");
    const rootCheckbox = screen.getByTestId(
      "checkbox-Root.md"
    ) as HTMLInputElement;
    expect(rootCheckbox.checked).toBe(true);

    // Press Space on tree node row
    fireEvent.keyDown(rootNode, { key: " " });
    expect(rootCheckbox.checked).toBe(false);

    // Press Space again
    fireEvent.keyDown(rootNode, { key: " " });
    expect(rootCheckbox.checked).toBe(true);
  });

  it("handles multi-level nested folders with tri-state propagation", () => {
    const nestedTree: FileTreeNode[] = [
      {
        id: "dept",
        name: "Department",
        path: "Department",
        kind: "folder",
        children: [
          {
            id: "team",
            name: "Team",
            path: "Department/Team",
            kind: "folder",
            children: [
              {
                id: "note-a",
                name: "A.md",
                path: "Department/Team/A.md",
                kind: "file",
              },
              {
                id: "note-b",
                name: "B.md",
                path: "Department/Team/B.md",
                kind: "file",
              },
            ],
          },
        ],
      },
    ];

    render(
      <ExportArchiveModal isOpen={true} onClose={vi.fn()} tree={nestedTree} />
    );

    const deptCheckbox = screen.getByTestId(
      "checkbox-Department"
    ) as HTMLInputElement;
    const teamCheckbox = screen.getByTestId(
      "checkbox-Department/Team"
    ) as HTMLInputElement;
    const aCheckbox = screen.getByTestId(
      "checkbox-Department/Team/A.md"
    ) as HTMLInputElement;

    // Initially all checked
    expect(deptCheckbox.checked).toBe(true);
    expect(teamCheckbox.checked).toBe(true);

    // Uncheck note A
    fireEvent.click(aCheckbox);

    // Both parent Team and ancestor Department should be indeterminate
    expect(teamCheckbox.indeterminate).toBe(true);
    expect(deptCheckbox.indeterminate).toBe(true);

    // Checking Department should re-check all descendants
    fireEvent.click(deptCheckbox);
    expect(aCheckbox.checked).toBe(true);
    expect(teamCheckbox.checked).toBe(true);
    expect(deptCheckbox.checked).toBe(true);
  });
});
