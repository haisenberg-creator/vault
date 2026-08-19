import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NoteActionBar } from "../NoteActionBar";

describe("NoteActionBar", () => {
  it("renders action buttons and triggers onAddTask callback", () => {
    const handleAddTask = vi.fn();
    render(<NoteActionBar onAddTask={handleAddTask} />);

    const addBtn = screen.getByTestId("note-action-add-task");
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(handleAddTask).toHaveBeenCalledTimes(1);
  });

  it("renders status buttons cleanly without redundant Open button", () => {
    render(<NoteActionBar />);

    expect(screen.queryByTestId("note-status-open")).not.toBeInTheDocument();
    expect(screen.getByTestId("note-status-in_progress")).toHaveTextContent(
      "In Progress"
    );
    expect(screen.getByTestId("note-status-blocked")).toHaveTextContent(
      "Blocked"
    );
    expect(screen.getByTestId("note-status-completed")).toHaveTextContent(
      "Done"
    );
  });

  it("triggers onChangeTaskStatus when a status button is clicked", () => {
    const handleChangeStatus = vi.fn();
    render(<NoteActionBar onChangeTaskStatus={handleChangeStatus} />);

    const inProgressBtn = screen.getByTestId("note-status-in_progress");
    fireEvent.click(inProgressBtn);

    expect(handleChangeStatus).toHaveBeenCalledWith("in_progress");
  });

  it("opens marker dropdown and applies selected prefix style", () => {
    const handleApplyPrefix = vi.fn();
    render(<NoteActionBar onApplyPrefix={handleApplyPrefix} />);

    const pickerBtn = screen.getByTestId("note-action-marker-picker");
    fireEvent.click(pickerBtn);

    expect(screen.getByTestId("marker-dropdown-menu")).toBeInTheDocument();

    const starOption = screen.getByTestId("marker-option-★");
    fireEvent.click(starOption);

    expect(handleApplyPrefix).toHaveBeenCalledWith("★ ");
  });

  it("triggers onInsertPriorityTemplate when Priority Template button is clicked", () => {
    const handleInsertPriorityTemplate = vi.fn();
    render(
      <NoteActionBar onInsertPriorityTemplate={handleInsertPriorityTemplate} />
    );

    const templateBtn = screen.getByTestId("note-action-priority-template");
    expect(templateBtn).toBeInTheDocument();
    fireEvent.click(templateBtn);

    expect(handleInsertPriorityTemplate).toHaveBeenCalledTimes(1);
  });

  it("triggers onInsertPriorityHeader when Urgent, High, or Low buttons are clicked", () => {
    const handleInsertPriorityHeader = vi.fn();
    render(
      <NoteActionBar onInsertPriorityHeader={handleInsertPriorityHeader} />
    );

    const urgentBtn = screen.getByTestId("note-action-priority-urgent");
    const highBtn = screen.getByTestId("note-action-priority-high");
    const lowBtn = screen.getByTestId("note-action-priority-low");

    expect(urgentBtn).toBeInTheDocument();
    expect(highBtn).toBeInTheDocument();
    expect(lowBtn).toBeInTheDocument();

    fireEvent.click(urgentBtn);
    expect(handleInsertPriorityHeader).toHaveBeenLastCalledWith("Urgent");

    fireEvent.click(highBtn);
    expect(handleInsertPriorityHeader).toHaveBeenLastCalledWith("High");

    fireEvent.click(lowBtn);
    expect(handleInsertPriorityHeader).toHaveBeenLastCalledWith("Low");
  });
});
