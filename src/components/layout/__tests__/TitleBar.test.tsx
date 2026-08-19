import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TitleBar } from "../TitleBar";

const revealItemInDirMock = vi.fn();
vi.mock("@tauri-apps/plugin-opener", () => ({
  revealItemInDir: (...args: unknown[]) => revealItemInDirMock(...args),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
  })),
}));

describe("TitleBar Component", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  it("renders branding title and theme mode toggle without file path text", () => {
    render(<TitleBar activeFilename="test-note.md" />);

    expect(screen.getByText("VAULT")).toBeInTheDocument();
    expect(screen.getByTestId("theme-mode-toggle-btn")).toBeInTheDocument();
    expect(screen.queryByText("test-note.md")).not.toBeInTheDocument();
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

  it("does not render path text even when activeFilename is a deep path", () => {
    render(
      <TitleBar activeFilename="C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Nested/Deep/Task.md" />
    );

    expect(screen.queryByText("Deep/Task.md")).not.toBeInTheDocument();
    expect(screen.queryByText("Task.md")).not.toBeInTheDocument();
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

  describe("Note icon right-click context menu", () => {
    const activeFile =
      "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Marketing/Campaign.md";

    it("opens context menu with three options when Note icon is right-clicked", () => {
      render(
        <TitleBar
          activeFilename={activeFile}
          workspaceDir="C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
        />
      );

      const noteIcon = screen.getByTestId("titlebar-note-icon");
      expect(noteIcon).toBeInTheDocument();

      expect(
        screen.queryByTestId("titlebar-context-menu")
      ).not.toBeInTheDocument();

      fireEvent.contextMenu(noteIcon);

      const menu = screen.getByTestId("titlebar-context-menu");
      expect(menu).toBeInTheDocument();
      expect(screen.getByTestId("menu-item-copy-path")).toHaveTextContent(
        "Copy Path"
      );
      expect(
        screen.getByTestId("menu-item-copy-relative-path")
      ).toHaveTextContent("Copy Relative Path");
      expect(screen.getByTestId("menu-item-reveal-file")).toHaveTextContent(
        "Reveal in File Explorer"
      );
    });

    it("copies full absolute path to clipboard when 'Copy Path' is clicked", async () => {
      render(
        <TitleBar
          activeFilename={activeFile}
          workspaceDir="C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
        />
      );

      fireEvent.contextMenu(screen.getByTestId("titlebar-note-icon"));
      const copyPathBtn = screen.getByTestId("menu-item-copy-path");
      fireEvent.click(copyPathBtn);

      expect(writeTextMock).toHaveBeenCalledWith(activeFile);
      await waitFor(() => {
        expect(
          screen.queryByTestId("titlebar-context-menu")
        ).not.toBeInTheDocument();
      });
    });

    it("copies short relative path to clipboard when 'Copy Relative Path' is clicked", async () => {
      render(
        <TitleBar
          activeFilename={activeFile}
          workspaceDir="C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
        />
      );

      fireEvent.contextMenu(screen.getByTestId("titlebar-note-icon"));
      const copyRelPathBtn = screen.getByTestId("menu-item-copy-relative-path");
      fireEvent.click(copyRelPathBtn);

      expect(writeTextMock).toHaveBeenCalledWith("Marketing/Campaign.md");
      await waitFor(() => {
        expect(
          screen.queryByTestId("titlebar-context-menu")
        ).not.toBeInTheDocument();
      });
    });

    it("triggers revealFileInExplorer when 'Reveal in File Explorer' is clicked", async () => {
      render(
        <TitleBar
          activeFilename={activeFile}
          workspaceDir="C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
        />
      );

      fireEvent.contextMenu(screen.getByTestId("titlebar-note-icon"));
      const revealBtn = screen.getByTestId("menu-item-reveal-file");
      fireEvent.click(revealBtn);

      await waitFor(() => {
        expect(
          screen.queryByTestId("titlebar-context-menu")
        ).not.toBeInTheDocument();
      });
    });

    it("closes context menu when Escape is pressed", () => {
      render(<TitleBar activeFilename={activeFile} />);

      fireEvent.contextMenu(screen.getByTestId("titlebar-note-icon"));
      expect(screen.getByTestId("titlebar-context-menu")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(
        screen.queryByTestId("titlebar-context-menu")
      ).not.toBeInTheDocument();
    });

    it("closes context menu when clicking outside", () => {
      render(
        <div>
          <TitleBar activeFilename={activeFile} />
          <div data-testid="outside-area">Outside</div>
        </div>
      );

      fireEvent.contextMenu(screen.getByTestId("titlebar-note-icon"));
      expect(screen.getByTestId("titlebar-context-menu")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("outside-area"));
      expect(
        screen.queryByTestId("titlebar-context-menu")
      ).not.toBeInTheDocument();
    });

    it("does not open context menu if no active note is present", () => {
      render(<TitleBar activeFilename="" />);

      const noteIcon = screen.getByTestId("titlebar-note-icon");
      fireEvent.contextMenu(noteIcon);

      expect(
        screen.queryByTestId("titlebar-context-menu")
      ).not.toBeInTheDocument();
    });
  });
});
