import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateNotification from "../UpdateNotification";
import { check } from "@tauri-apps/plugin-updater";

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: vi.fn(),
}));

describe("UpdateNotification Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when no update is available", async () => {
    vi.mocked(check).mockResolvedValue(null);

    const { container } = render(<UpdateNotification />);

    await waitFor(() => {
      expect(check).toHaveBeenCalledTimes(1);
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("renders update notification card when an update is available", async () => {
    const mockUpdate = {
      version: "1.1.0",
      currentVersion: "1.0.0",
      body: "Release notes",
      downloadAndInstall: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(check).mockResolvedValue(mockUpdate as any);

    render(<UpdateNotification />);

    expect(await screen.findByText("Update Available!")).toBeInTheDocument();
    expect(
      screen.getByText(/Version 1.1.0 is ready to install/)
    ).toBeInTheDocument();
    expect(screen.getByText("Later")).toBeInTheDocument();
    expect(screen.getByText("Install Now")).toBeInTheDocument();
  });

  it("dismisses the notification when 'Later' is clicked", async () => {
    const mockUpdate = {
      version: "1.1.0",
      currentVersion: "1.0.0",
      downloadAndInstall: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(check).mockResolvedValue(mockUpdate as any);

    render(<UpdateNotification />);

    const laterBtn = await screen.findByText("Later");
    fireEvent.click(laterBtn);

    expect(screen.queryByText("Update Available!")).not.toBeInTheDocument();
  });

  it("triggers downloadAndInstall when 'Install Now' is clicked", async () => {
    const downloadAndInstallMock = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

    const mockUpdate = {
      version: "1.1.0",
      currentVersion: "1.0.0",
      downloadAndInstall: downloadAndInstallMock,
    };

    vi.mocked(check).mockResolvedValue(mockUpdate as any);

    render(<UpdateNotification />);

    const installBtn = await screen.findByText("Install Now");
    fireEvent.click(installBtn);

    expect(screen.getByText("Installing...")).toBeInTheDocument();
    expect(downloadAndInstallMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(downloadAndInstallMock).toHaveBeenCalled();
    });
  });

  it("handles check() error gracefully without crashing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(check).mockRejectedValue(new Error("Permission denied"));

    const { container } = render(<UpdateNotification />);

    await waitFor(() => {
      expect(check).toHaveBeenCalledTimes(1);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to check for updates:",
      expect.any(Error)
    );
    expect(container).toBeEmptyDOMElement();
    consoleSpy.mockRestore();
  });

  it("handles downloadAndInstall error gracefully and resets installing state", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const downloadAndInstallMock = vi
      .fn()
      .mockRejectedValue(new Error("Network failed"));

    const mockUpdate = {
      version: "1.1.0",
      currentVersion: "1.0.0",
      downloadAndInstall: downloadAndInstallMock,
    };

    vi.mocked(check).mockResolvedValue(mockUpdate as any);

    render(<UpdateNotification />);

    const installBtn = await screen.findByText("Install Now");
    fireEvent.click(installBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to install update:",
        expect.any(Error)
      );
      expect(screen.getByText("Install Now")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
