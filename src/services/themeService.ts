export type ThemeMode = "working" | "arcade";

const THEME_KEY = "vault_theme_mode";

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "working";
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "arcade" ? "arcade" : "working";
}

export function setThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, mode);
  applyThemeMode(mode);
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  if (mode === "arcade") {
    document.documentElement.classList.add("theme-arcade");
  } else {
    document.documentElement.classList.remove("theme-arcade");
  }
}

export function toggleThemeMode(): ThemeMode {
  const current = getThemeMode();
  const next = current === "working" ? "arcade" : "working";
  setThemeMode(next);
  return next;
}
