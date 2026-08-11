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
});
