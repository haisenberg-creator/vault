export type ThemeMode = "working" | "arcade";
export type LiveBackgroundScope = "full" | "sidebar";
export type ThemePalette =
  | "rose-pine"
  | "nord"
  | "tokyo-night"
  | "catppuccin-mocha"
  | "dracula-pro"
  | "gruvbox-dark"
  | "catppuccin-latte";

const THEME_MODE_KEY = "vault_theme_mode";
const THEME_PALETTE_KEY = "vault_theme_palette";
const LIVE_BG_KEY = "vault_live_background";
const LIVE_BG_SCOPE_KEY = "vault_live_bg_scope";
const LIVE_BG_OPACITY_KEY = "vault_live_bg_opacity";
const LIVE_BG_BLUR_KEY = "vault_live_bg_blur";

export const ALL_THEME_PALETTES: ThemePalette[] = [
  "rose-pine",
  "nord",
  "tokyo-night",
  "catppuccin-mocha",
  "dracula-pro",
  "gruvbox-dark",
  "catppuccin-latte",
];

type ThemeChangeListener = () => void;
const listeners: Set<ThemeChangeListener> = new Set();

function notifyListeners(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn("Theme listener error:", e);
    }
  });
}

export function subscribeTheme(listener: ThemeChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "working";
  const saved = localStorage.getItem(THEME_MODE_KEY);
  return saved === "arcade" ? "arcade" : "working";
}

export function setThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_MODE_KEY, mode);
  applyThemeMode(mode);
  notifyListeners();
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof window === "undefined" || !document.documentElement) return;
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

export function getThemePalette(): ThemePalette {
  if (typeof window === "undefined") return "rose-pine";
  const saved = localStorage.getItem(THEME_PALETTE_KEY) as ThemePalette;
  if (ALL_THEME_PALETTES.includes(saved)) {
    return saved;
  }
  return "rose-pine";
}

export function setThemePalette(palette: ThemePalette): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_PALETTE_KEY, palette);
  applyThemePalette(palette);
  notifyListeners();
}

export function applyThemePalette(palette: ThemePalette): void {
  if (typeof window === "undefined" || !document.documentElement) return;
  ALL_THEME_PALETTES.forEach((p) => {
    document.documentElement.classList.remove(`theme-${p}`);
  });
  document.documentElement.classList.add(`theme-${palette}`);
  document.documentElement.dataset.theme = palette;
}

export function getLiveBackground(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LIVE_BG_KEY);
}

export function getLiveBackgroundScope(): LiveBackgroundScope {
  if (typeof window === "undefined") return "full";
  const saved = localStorage.getItem(LIVE_BG_SCOPE_KEY);
  return saved === "sidebar" ? "sidebar" : "full";
}

export function setLiveBackgroundScope(scope: LiveBackgroundScope): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIVE_BG_SCOPE_KEY, scope);
  applyLiveBackground(getLiveBackground(), scope);
  notifyListeners();
}

export function setLiveBackground(bgUrlOrData: string | null): void {
  if (typeof window === "undefined") return;
  if (bgUrlOrData) {
    localStorage.setItem(LIVE_BG_KEY, bgUrlOrData);
  } else {
    localStorage.removeItem(LIVE_BG_KEY);
  }
  applyLiveBackground(bgUrlOrData, getLiveBackgroundScope());
  notifyListeners();
}

export function applyLiveBackground(
  bgUrlOrData: string | null,
  scope: LiveBackgroundScope = getLiveBackgroundScope()
): void {
  if (typeof window === "undefined" || !document.documentElement) return;
  if (bgUrlOrData) {
    document.documentElement.style.setProperty(
      "--live-bg-url",
      `url("${bgUrlOrData}")`
    );
    if (scope === "sidebar") {
      document.documentElement.classList.remove("has-live-bg");
      document.documentElement.classList.add("has-sidebar-live-bg");
    } else {
      document.documentElement.classList.remove("has-sidebar-live-bg");
      document.documentElement.classList.add("has-live-bg");
    }
  } else {
    document.documentElement.style.removeProperty("--live-bg-url");
    document.documentElement.classList.remove("has-live-bg");
    document.documentElement.classList.remove("has-sidebar-live-bg");
  }
}

export function getLiveBackgroundOpacity(): number {
  if (typeof window === "undefined") return 0.3;
  const saved = localStorage.getItem(LIVE_BG_OPACITY_KEY);
  if (saved !== null) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
  }
  return 0.3;
}

export function setLiveBackgroundOpacity(opacity: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIVE_BG_OPACITY_KEY, opacity.toString());
  if (document.documentElement) {
    document.documentElement.style.setProperty(
      "--live-bg-opacity",
      opacity.toString()
    );
  }
  notifyListeners();
}

export function getLiveBackgroundBlur(): number {
  if (typeof window === "undefined") return 0;
  const saved = localStorage.getItem(LIVE_BG_BLUR_KEY);
  if (saved !== null) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 40) return parsed;
  }
  return 0;
}

export function setLiveBackgroundBlur(blur: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIVE_BG_BLUR_KEY, blur.toString());
  if (document.documentElement) {
    document.documentElement.style.setProperty("--live-bg-blur", `${blur}px`);
  }
  notifyListeners();
}

export function initTheme(): void {
  applyThemeMode(getThemeMode());
  applyThemePalette(getThemePalette());
  applyLiveBackground(getLiveBackground(), getLiveBackgroundScope());
  setLiveBackgroundOpacity(getLiveBackgroundOpacity());
  setLiveBackgroundBlur(getLiveBackgroundBlur());
}
