import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getThemeMode,
  setThemeMode,
  toggleThemeMode,
  getThemePalette,
  setThemePalette,
  getLiveBackground,
  setLiveBackground,
  getLiveBackgroundOpacity,
  setLiveBackgroundOpacity,
  getLiveBackgroundBlur,
  setLiveBackgroundBlur,
  subscribeTheme,
  initTheme,
} from "../themeService";

describe("themeService", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.cssText = "";
  });

  it("defaults to working mode when no setting saved", () => {
    expect(getThemeMode()).toBe("working");
  });

  it("saves and applies arcade mode", () => {
    setThemeMode("arcade");
    expect(getThemeMode()).toBe("arcade");
    expect(document.documentElement.classList.contains("theme-arcade")).toBe(
      true
    );
  });

  it("toggles mode from working to arcade and back", () => {
    expect(toggleThemeMode()).toBe("arcade");
    expect(getThemeMode()).toBe("arcade");
    expect(toggleThemeMode()).toBe("working");
    expect(getThemeMode()).toBe("working");
  });

  it("defaults to rose-pine palette and switches to nord and tokyo-night", () => {
    expect(getThemePalette()).toBe("rose-pine");

    setThemePalette("nord");
    expect(getThemePalette()).toBe("nord");
    expect(document.documentElement.classList.contains("theme-nord")).toBe(
      true
    );
    expect(document.documentElement.dataset.theme).toBe("nord");

    setThemePalette("tokyo-night");
    expect(getThemePalette()).toBe("tokyo-night");
    expect(
      document.documentElement.classList.contains("theme-tokyo-night")
    ).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("tokyo-night");
  });

  it("manages live background image and CSS variables", () => {
    expect(getLiveBackground()).toBeNull();

    const sampleBg = "data:image/png;base64,samplebase64data";
    setLiveBackground(sampleBg);
    expect(getLiveBackground()).toBe(sampleBg);
    expect(document.documentElement.classList.contains("has-live-bg")).toBe(
      true
    );
    expect(
      document.documentElement.style.getPropertyValue("--live-bg-url")
    ).toBe(`url("${sampleBg}")`);

    setLiveBackground(null);
    expect(getLiveBackground()).toBeNull();
    expect(document.documentElement.classList.contains("has-live-bg")).toBe(
      false
    );
  });

  it("manages opacity and blur settings for live backgrounds", () => {
    expect(getLiveBackgroundOpacity()).toBe(0.3);
    setLiveBackgroundOpacity(0.65);
    expect(getLiveBackgroundOpacity()).toBe(0.65);
    expect(
      document.documentElement.style.getPropertyValue("--live-bg-opacity")
    ).toBe("0.65");

    expect(getLiveBackgroundBlur()).toBe(0);
    setLiveBackgroundBlur(12);
    expect(getLiveBackgroundBlur()).toBe(12);
    expect(
      document.documentElement.style.getPropertyValue("--live-bg-blur")
    ).toBe("12px");
  });

  it("notifies subscribers on theme changes", () => {
    const listener = vi.fn();
    const unsub = subscribeTheme(listener);

    setThemePalette("nord");
    expect(listener).toHaveBeenCalledTimes(1);

    setLiveBackground("https://example.com/bg.png");
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    setThemePalette("rose-pine");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("initializes theme from storage correctly", () => {
    localStorage.setItem("vault_theme_mode", "arcade");
    localStorage.setItem("vault_theme_palette", "tokyo-night");
    localStorage.setItem("vault_live_background", "https://example.com/bg.gif");
    localStorage.setItem("vault_live_bg_opacity", "0.5");
    localStorage.setItem("vault_live_bg_blur", "8");

    initTheme();

    expect(document.documentElement.classList.contains("theme-arcade")).toBe(
      true
    );
    expect(
      document.documentElement.classList.contains("theme-tokyo-night")
    ).toBe(true);
    expect(document.documentElement.classList.contains("has-live-bg")).toBe(
      true
    );
  });
});
