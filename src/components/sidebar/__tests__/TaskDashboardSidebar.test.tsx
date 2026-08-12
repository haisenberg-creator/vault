import { render, screen, fireEvent, act } from "@testing-library/react";
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

  it("renders header and navigation tabs", async () => {
    await act(async () => {
      render(<TaskDashboardSidebar tasks={sampleTasks} />);
    });

    expect(screen.getByText("TASK DASHBOARD")).toBeInTheDocument();
    expect(screen.getByTestId("tab-files")).toBeInTheDocument();
    expect(screen.getByTestId("tab-tasks")).toBeInTheDocument();
  });

  it("switches between Files and Tasks tabs", async () => {
    await act(async () => {
      render(<TaskDashboardSidebar tasks={sampleTasks} initialTab="tasks" />);
    });

    // In Tasks tab
    expect(screen.getByTestId("filter-btn-all")).toHaveTextContent("all (4)");

    // Switch to Files tab
    await act(async () => {
      fireEvent.click(screen.getByTestId("tab-files"));
    });

    expect(screen.getByTestId("sidebar-action-new-note")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-action-new-folder")).toBeInTheDocument();
    expect(
      screen.getByTestId("sidebar-action-new-dashboard")
    ).toBeInTheDocument();
  });

  it("renders all task items when Tasks tab is selected", async () => {
    await act(async () => {
      render(<TaskDashboardSidebar tasks={sampleTasks} initialTab="tasks" />);
    });

    expect(screen.getByText("First task open")).toBeInTheDocument();
    expect(screen.getByText("Second task in progress")).toBeInTheDocument();
    expect(screen.getByText("Third task blocked")).toBeInTheDocument();
    expect(screen.getByText("Fourth task completed")).toBeInTheDocument();
  });

  it("filters tasks when filter tab buttons are clicked in Tasks tab", async () => {
    await act(async () => {
      render(<TaskDashboardSidebar tasks={sampleTasks} initialTab="tasks" />);
    });

    const openFilterBtn = screen.getByTestId("filter-btn-open");
    await act(async () => {
      fireEvent.click(openFilterBtn);
    });

    expect(screen.getByText("First task open")).toBeInTheDocument();
    expect(
      screen.queryByText("Second task in progress")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Third task blocked")).not.toBeInTheDocument();

    const completedFilterBtn = screen.getByTestId("filter-btn-completed");
    await act(async () => {
      fireEvent.click(completedFilterBtn);
    });

    expect(screen.getByText("Fourth task completed")).toBeInTheDocument();
    expect(screen.queryByText("First task open")).not.toBeInTheDocument();
  });

  it("calls onToggleTask callback when a task item card is clicked in Tasks tab", async () => {
    const handleToggle = vi.fn();
    await act(async () => {
      render(
        <TaskDashboardSidebar
          tasks={sampleTasks}
          initialTab="tasks"
          onToggleTask={handleToggle}
        />
      );
    });

    const taskItem = screen.getByTestId("sidebar-task-item-node-2");
    await act(async () => {
      fireEvent.click(taskItem);
    });

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith("node-2");
  });

  it("renders empty state message when tasks list is empty in Tasks tab", async () => {
    await act(async () => {
      render(<TaskDashboardSidebar tasks={[]} initialTab="tasks" />);
    });

    expect(screen.getByTestId("empty-tasks-message")).toHaveTextContent(
      "No tasks found"
    );
  });

  it("calculates note progress percentage correctly in Tasks tab", async () => {
    let rerenderFn: any;
    await act(async () => {
      const { rerender } = render(
        <TaskDashboardSidebar tasks={sampleTasks} initialTab="tasks" />
      );
      rerenderFn = rerender;
    });

    expect(screen.getByTestId("note-progress-note.md")).toHaveTextContent(
      "25%"
    );

    // 2 completed out of 5 tasks in note.md = 40%
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
    await act(async () => {
      rerenderFn(
        <TaskDashboardSidebar tasks={updatedTasks} initialTab="tasks" />
      );
    });

    expect(screen.getByTestId("note-progress-note.md")).toHaveTextContent(
      "40%"
    );
  });

  it("applies task-completed-text class to completed tasks in Tasks tab", async () => {
    await act(async () => {
      render(<TaskDashboardSidebar tasks={sampleTasks} initialTab="tasks" />);
    });

    const openTask = screen.getByText("First task open");
    const completedTask = screen.getByText("Fourth task completed");

    expect(openTask).toHaveClass("task-title-text");
    expect(completedTask).toHaveClass("task-completed-text");
  });

  it("opens move task modal when move button is clicked", async () => {
    const handleMove = vi.fn();
    await act(async () => {
      render(
        <TaskDashboardSidebar
          tasks={sampleTasks}
          initialTab="tasks"
          onMoveTaskToNote={handleMove}
        />
      );
    });

    const moveBtn = screen.getByTestId("move-task-btn-node-1");
    await act(async () => {
      fireEvent.click(moveBtn);
    });

    expect(screen.getByTestId("move-task-modal")).toBeInTheDocument();
  });

  it("switches to Files & Folders tab when dragging over tab-files header", async () => {
    await act(async () => {
      render(<TaskDashboardSidebar tasks={sampleTasks} initialTab="tasks" />);
    });

    const tabFilesBtn = screen.getByTestId("tab-files");
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(),
      dropEffect: "",
    };

    await act(async () => {
      fireEvent.dragOver(tabFilesBtn, { dataTransfer });
    });

    expect(screen.getByTestId("sidebar-tree-container")).toBeInTheDocument();
  });

  it("calls onDeleteTask callback when delete button is clicked and confirmed", async () => {
    const handleDelete = vi.fn();
    const windowConfirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => true);

    await act(async () => {
      render(
        <TaskDashboardSidebar
          tasks={sampleTasks}
          initialTab="tasks"
          onDeleteTask={handleDelete}
        />
      );
    });

    const deleteBtn = screen.getByTestId("delete-task-btn-node-1");
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(windowConfirmSpy).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledWith("node-1");

    windowConfirmSpy.mockRestore();
  });
});
