import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TitleBar } from "../TitleBar";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
  })),
}));

describe("TitleBar Component", () => {
  it("renders branding title and active filename", () => {
    render(<TitleBar activeFilename="test-note.md" />);

    expect(screen.getByText("VAULT")).toBeInTheDocument();
    expect(screen.getByText("test-note.md")).toBeInTheDocument();
  });

  it("renders window action buttons for minimize, maximize, and close", () => {
    render(<TitleBar activeFilename="test-note.md" />);

    const minimizeBtn = screen.getByTestId("window-minimize");
    const maximizeBtn = screen.getByTestId("window-maximize");
    const closeBtn = screen.getByTestId("window-close");

    expect(minimizeBtn).toBeInTheDocument();
    expect(maximizeBtn).toBeInTheDocument();
    expect(closeBtn).toBeInTheDocument();
  });

  it("triggers click events on window controls without crashing", () => {
    render(<TitleBar activeFilename="test-note.md" />);

    const minimizeBtn = screen.getByTestId("window-minimize");
    const maximizeBtn = screen.getByTestId("window-maximize");
    const closeBtn = screen.getByTestId("window-close");

    fireEvent.click(minimizeBtn);
    fireEvent.click(maximizeBtn);
    fireEvent.click(closeBtn);
  });
});
