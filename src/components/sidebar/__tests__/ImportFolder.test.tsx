import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskDashboardSidebar } from "../TaskDashboardSidebar";
import * as fileService from "../../../services/fileService";

describe("Import Folder Functionality", () => {
  beforeEach(() => {
    fileService.clearMockStorage();
  });

  it("importFolderFiles converts .txt files to .md files in the workspace", async () => {
    const mockFiles = [
      {
        path: "ImportedProject/notes.txt",
        content: "# My Notes\n- [ ] Task 1",
      },
      { path: "ImportedProject/Sub/readme.txt", content: "Subfolder info" },
      { path: "ImportedProject/already-md.md", content: "# Markdown file" },
    ];

    const result = await fileService.importFolderFiles(mockFiles);

    expect(result).toEqual([
      "ImportedProject/notes.md",
      "ImportedProject/Sub/readme.md",
      "ImportedProject/already-md.md",
    ]);

    const readNotes = await fileService.readMarkdownFile(
      "ImportedProject/notes.md"
    );
    expect(readNotes).toBe("# My Notes\n- [ ] Task 1");

    const readSub = await fileService.readMarkdownFile(
      "ImportedProject/Sub/readme.md"
    );
    expect(readSub).toBe("Subfolder info");
  });

  it("importFolderFiles converts .docx files to .md notes", async () => {
    // Mock convertDocxToMarkdown or test with sample mock buffer
    const mockFiles = [
      {
        path: "Documents/Specification.docx",
        content: "# Document Specification\n\n- [ ] Converted Task",
      },
    ];

    const result = await fileService.importFolderFiles(mockFiles);
    expect(result).toEqual(["Documents/Specification.md"]);

    const content = await fileService.readMarkdownFile(
      "Documents/Specification.md"
    );
    expect(content).toBe("# Document Specification\n\n- [ ] Converted Task");
  });

  it("importFolderFiles supports placing imported files into a target folder", async () => {
    const mockFiles = [
      {
        path: "notes.txt",
        content: "Target note content",
      },
    ];

    const result = await fileService.importFolderFiles(
      mockFiles,
      "Projects/Client"
    );
    expect(result).toEqual(["Projects/Client/notes.md"]);

    const content = await fileService.readMarkdownFile(
      "Projects/Client/notes.md"
    );
    expect(content).toBe("Target note content");
  });

  it("renders Import Note/Folder button in TaskDashboardSidebar on Files tab", async () => {
    render(<TaskDashboardSidebar initialTab="files" />);

    const importBtn = screen.getByTestId("sidebar-action-import-folder");
    expect(importBtn).toBeInTheDocument();
    expect(importBtn).toHaveTextContent("Import Note/Folder");

    const hiddenInput = screen.getByTestId("import-folder-input");
    expect(hiddenInput).toBeInTheDocument();
  });

  it("disables dragging for completed tasks in TaskDashboardSidebar", async () => {
    const tasks = [
      {
        id: "task-open-1",
        title: "Open Task",
        sourceFile: "notes.md",
        state: "open" as const,
      },
      {
        id: "task-done-1",
        title: "Completed Task",
        sourceFile: "notes.md",
        state: "completed" as const,
      },
    ];

    render(<TaskDashboardSidebar tasks={tasks} initialTab="tasks" />);

    const openTaskEl = screen.getByTestId("sidebar-task-item-task-open-1");
    expect(openTaskEl).toHaveAttribute("draggable", "true");

    const doneTaskEl = screen.getByTestId("sidebar-task-item-task-done-1");
    expect(doneTaskEl).toHaveAttribute("draggable", "false");

    // Attempt dragStart on open task -> setData should be called
    const openSetDataSpy = vi.fn();
    fireEvent.dragStart(openTaskEl, {
      dataTransfer: {
        setData: openSetDataSpy,
      },
    });
    expect(openSetDataSpy).toHaveBeenCalled();

    // Attempt dragStart on completed task -> setData should NOT be called
    const doneSetDataSpy = vi.fn();
    fireEvent.dragStart(doneTaskEl, {
      dataTransfer: {
        setData: doneSetDataSpy,
      },
    });
    expect(doneSetDataSpy).not.toHaveBeenCalled();
  });
});
