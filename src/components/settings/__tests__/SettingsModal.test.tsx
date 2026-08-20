import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SettingsModal } from "../SettingsModal";
import * as themeService from "../../../services/themeService";

describe("SettingsModal Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.cssText = "";
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<SettingsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
  });

  it("renders modal with header and tabs when isOpen is true", () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
    expect(screen.getByText("Vault Settings")).toBeInTheDocument();
    expect(screen.getByTestId("settings-tab-themes")).toBeInTheDocument();
    expect(screen.getByTestId("settings-tab-backgrounds")).toBeInTheDocument();
  });

  it("switches tabs between Themes and Live Background", () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    // Initially on Themes tab
    expect(screen.getByText("Color Palette")).toBeInTheDocument();

    // Switch to Live Background tab
    fireEvent.click(screen.getByTestId("settings-tab-backgrounds"));
    expect(screen.getByText("Live Background Image / GIF")).toBeInTheDocument();
    expect(
      screen.getByText("Upload Local Image or Animated GIF")
    ).toBeInTheDocument();

    // Switch back to Themes tab
    fireEvent.click(screen.getByTestId("settings-tab-themes"));
    expect(screen.getByText("Color Palette")).toBeInTheDocument();
  });

  it("selects theme palette and updates themeService and document for all 7 palettes", () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    const palettes = [
      "nord",
      "tokyo-night",
      "catppuccin-mocha",
      "dracula-pro",
      "gruvbox-dark",
      "catppuccin-latte",
      "rose-pine",
    ] as const;

    for (const palette of palettes) {
      fireEvent.click(screen.getByTestId(`theme-option-${palette}`));
      expect(themeService.getThemePalette()).toBe(palette);
      expect(document.documentElement.dataset.theme).toBe(palette);
    }
  });

  it("toggles interface mode between Working and Arcade", () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    // Click Arcade mode
    fireEvent.click(screen.getByTestId("mode-option-arcade"));
    expect(themeService.getThemeMode()).toBe("arcade");
    expect(document.documentElement.classList.contains("theme-arcade")).toBe(
      true
    );

    // Click Working mode
    fireEvent.click(screen.getByTestId("mode-option-working"));
    expect(themeService.getThemeMode()).toBe("working");
    expect(document.documentElement.classList.contains("theme-arcade")).toBe(
      false
    );
  });

  it("selects preset live background and adjusts opacity and blur", () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId("settings-tab-backgrounds"));

    // Select Cosmic preset
    fireEvent.click(screen.getByTestId("bg-preset-cosmic"));
    expect(themeService.getLiveBackground()).toContain("unsplash.com");
    expect(document.documentElement.classList.contains("has-live-bg")).toBe(
      true
    );

    // Adjust opacity slider
    const opacitySlider = screen.getByTestId("bg-opacity-slider");
    fireEvent.change(opacitySlider, { target: { value: "0.8" } });
    expect(themeService.getLiveBackgroundOpacity()).toBe(0.8);

    // Adjust blur slider
    const blurSlider = screen.getByTestId("bg-blur-slider");
    fireEvent.change(blurSlider, { target: { value: "10" } });
    expect(themeService.getLiveBackgroundBlur()).toBe(10);

    // Remove background
    const clearBtn = screen.getByTestId("bg-clear-btn");
    fireEvent.click(clearBtn);
    expect(themeService.getLiveBackground()).toBeNull();
    expect(document.documentElement.classList.contains("has-live-bg")).toBe(
      false
    );
  });

  it("handles local file upload for live background", async () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId("settings-tab-backgrounds"));

    const fileInput = screen.getByTestId("bg-upload-input");
    const file = new File(["fake image content"], "wallpaper.gif", {
      type: "image/gif",
    });

    // Mock FileReader
    const readAsDataURLMock = vi.fn();
    class MockFileReader {
      onload: ((event: any) => void) | null = null;
      readAsDataURL(f: any) {
        readAsDataURLMock(f);
        if (this.onload) {
          this.onload({
            target: { result: "data:image/gif;base64,samplegif" },
          });
        }
      }
    }
    vi.stubGlobal("FileReader", MockFileReader);

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(readAsDataURLMock).toHaveBeenCalledWith(file);
    expect(themeService.getLiveBackground()).toBe(
      "data:image/gif;base64,samplegif"
    );
  });

  it("calls onClose when close button or backdrop is clicked", () => {
    const handleClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={handleClose} />);

    // Click close button
    fireEvent.click(screen.getByTestId("settings-close-btn"));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Click backdrop
    fireEvent.click(screen.getByTestId("settings-modal-backdrop"));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
