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

  it("displays clean relative path when activeFilename is an absolute system path", () => {
    render(
      <TitleBar activeFilename="C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Eucerin.md" />
    );

    expect(screen.getByText("Projects/Eucerin.md")).toBeInTheDocument();
  });

  it("displays only the last two path segments when activeFilename is a deeply nested absolute path", () => {
    render(
      <TitleBar activeFilename="C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Nested/Deep/Task.md" />
    );

    expect(screen.getByText("Deep/Task.md")).toBeInTheDocument();
  });

  it("displays single segment paths cleanly without leading slash", () => {
    render(<TitleBar activeFilename="single-note.md" />);

    expect(screen.getByText("single-note.md")).toBeInTheDocument();
  });

  it("renders theme mode toggle button in TitleBar and handles clicks", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <TitleBar
        activeFilename="test-note.md"
        themeMode="working"
        onToggleThemeMode={onToggle}
      />
    );

    const toggleBtn = screen.getByTestId("theme-mode-toggle-btn");
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent("WORKING");

    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <TitleBar
        activeFilename="test-note.md"
        themeMode="arcade"
        onToggleThemeMode={onToggle}
      />
    );
    expect(screen.getByTestId("theme-mode-toggle-btn")).toHaveTextContent(
      "ARCADE"
    );
  });
});
