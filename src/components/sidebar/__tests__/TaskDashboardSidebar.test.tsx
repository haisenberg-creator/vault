import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskDashboardSidebar, TaskItem } from "../TaskDashboardSidebar";

describe("TaskDashboardSidebar Component", () => {
  const sampleTasks: TaskItem[] = [
    {
      id: "node-1",
      title: "First task open",
      sourceFile: "note.md",
      state: "open",
    },
    {
      id: "node-2",
      title: "Second task in progress",
      sourceFile: "note.md",
      state: "in_progress",
    },
    {
      id: "node-3",
      title: "Third task blocked",
      sourceFile: "note.md",
      state: "blocked",
    },
    {
      id: "node-4",
      title: "Fourth task completed",
      sourceFile: "note.md",
      state: "completed",
    },
  ];

  it("renders header and task counts accurately", () => {
    render(<TaskDashboardSidebar tasks={sampleTasks} />);

    expect(screen.getByText("TASK DASHBOARD")).toBeInTheDocument();
    expect(screen.getByTestId("filter-btn-all")).toHaveTextContent("all (4)");
    expect(screen.getByTestId("filter-btn-open")).toHaveTextContent("open (1)");
    expect(screen.getByTestId("filter-btn-in_progress")).toHaveTextContent(
      "in progress (1)"
    );
    expect(screen.getByTestId("filter-btn-blocked")).toHaveTextContent(
      "blocked (1)"
    );
    expect(screen.getByTestId("filter-btn-completed")).toHaveTextContent(
      "completed (1)"
    );
  });

  it("renders all task items by default", () => {
    render(<TaskDashboardSidebar tasks={sampleTasks} />);

    expect(screen.getByText("First task open")).toBeInTheDocument();
    expect(screen.getByText("Second task in progress")).toBeInTheDocument();
    expect(screen.getByText("Third task blocked")).toBeInTheDocument();
    expect(screen.getByText("Fourth task completed")).toBeInTheDocument();
  });

  it("filters tasks when filter tab buttons are clicked", () => {
    render(<TaskDashboardSidebar tasks={sampleTasks} />);

    const openFilterBtn = screen.getByTestId("filter-btn-open");
    fireEvent.click(openFilterBtn);

    expect(screen.getByText("First task open")).toBeInTheDocument();
    expect(
      screen.queryByText("Second task in progress")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Third task blocked")).not.toBeInTheDocument();

    const completedFilterBtn = screen.getByTestId("filter-btn-completed");
    fireEvent.click(completedFilterBtn);

    expect(screen.getByText("Fourth task completed")).toBeInTheDocument();
    expect(screen.queryByText("First task open")).not.toBeInTheDocument();
  });

  it("calls onToggleTask callback when a task item card is clicked", () => {
    const handleToggle = vi.fn();
    render(
      <TaskDashboardSidebar tasks={sampleTasks} onToggleTask={handleToggle} />
    );

    const taskItem = screen.getByTestId("sidebar-task-item-node-2");
    fireEvent.click(taskItem);

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith("node-2");
  });

  it("renders empty state message when tasks list is empty", () => {
    render(<TaskDashboardSidebar tasks={[]} />);

    expect(screen.getByTestId("empty-tasks-message")).toHaveTextContent(
      "No tasks found"
    );
  });

  it("calculates workspace progress meter percentage correctly", () => {
    // 1 completed out of 4 tasks = 25%
    const { rerender } = render(<TaskDashboardSidebar tasks={sampleTasks} />);

    expect(screen.getByTestId("workspace-progress-meter")).toHaveTextContent(
      "25%"
    );
    expect(screen.getByTestId("progress-bar-fill")).toHaveStyle({
      width: "25%",
    });

    // 2 completed out of 4 tasks = 50%
    const updatedTasks: TaskItem[] = [
      ...sampleTasks.slice(0, 3),
      { ...sampleTasks[3] },
      {
        id: "node-5",
        title: "Fifth task completed",
        sourceFile: "note.md",
        state: "completed",
      },
    ];
    rerender(<TaskDashboardSidebar tasks={updatedTasks} />);

    expect(screen.getByTestId("workspace-progress-meter")).toHaveTextContent(
      "40%"
    );
    expect(screen.getByTestId("progress-bar-fill")).toHaveStyle({
      width: "40%",
    });
  });

  it("applies task-completed-text class to completed tasks", () => {
    render(<TaskDashboardSidebar tasks={sampleTasks} />);

    const openTask = screen.getByText("First task open");
    const completedTask = screen.getByText("Fourth task completed");

    expect(openTask).toHaveClass("task-title-text");
    expect(completedTask).toHaveClass("task-completed-text");
  });
});
