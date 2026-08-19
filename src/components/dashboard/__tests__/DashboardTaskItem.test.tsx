import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardTaskItem } from "../DashboardTaskItem";
import { TaskItemWithMetadata } from "../../../types/dashboard";

describe("DashboardTaskItem Component", () => {
  const sampleTask: TaskItemWithMetadata = {
    id: "t-1",
    nodeKey: "nk-1",
    title: "Urgent bugfix",
    sourceFile: "Projects/Client-A/App.md",
    state: "open",
    tags: ["#urgent"],
    folderPath: "Projects/Client-A",
    noteName: "App.md",
    lineIndex: 5,
    priority: "urgent",
  };

  it("renders task title, badges, and link", () => {
    render(
      <DashboardTaskItem
        task={sampleTask}
        onToggleState={vi.fn()}
        onSelectFile={vi.fn()}
      />
    );

    expect(screen.getByText("Urgent bugfix")).toBeInTheDocument();
    expect(screen.getByText("#urgent")).toBeInTheDocument();
    expect(screen.getByText("App.md")).toBeInTheDocument();
  });

  it("includes task priority in onDragStart application/json payload", () => {
    render(
      <DashboardTaskItem
        task={sampleTask}
        onToggleState={vi.fn()}
        onSelectFile={vi.fn()}
      />
    );

    const taskItem = screen.getByTestId("task-item-t-1");
    expect(taskItem).toHaveAttribute("draggable", "true");

    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: "",
    };

    fireEvent.dragStart(taskItem, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        taskTitle: "Urgent bugfix",
        sourceFile: "Projects/Client-A/App.md",
        priority: "urgent",
      })
    );
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "text/plain",
      "task-drag:Urgent bugfix"
    );
  });

  it("calls onSelectTag when a tag badge is clicked", () => {
    const handleSelectTag = vi.fn();
    render(
      <DashboardTaskItem
        task={sampleTask}
        onToggleState={vi.fn()}
        onSelectFile={vi.fn()}
        onSelectTag={handleSelectTag}
      />
    );

    const tagBadge = screen.getByTestId("task-tag-badge-#urgent");
    expect(tagBadge).toBeInTheDocument();
    fireEvent.click(tagBadge);

    expect(handleSelectTag).toHaveBeenCalledWith("#urgent");
  });
});
