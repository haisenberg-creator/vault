import { describe, it, expect, beforeEach } from "vitest";
import { getThemeMode, setThemeMode, toggleThemeMode } from "../themeService";

describe("themeService", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("theme-arcade");
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
});
