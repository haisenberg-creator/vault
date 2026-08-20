import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  X,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Trash2,
  Check,
} from "lucide-react";
import {
  ThemePalette,
  ThemeMode,
  getThemePalette,
  setThemePalette,
  getThemeMode,
  setThemeMode,
  getLiveBackground,
  setLiveBackground,
  getLiveBackgroundOpacity,
  setLiveBackgroundOpacity,
  getLiveBackgroundBlur,
  setLiveBackgroundBlur,
} from "../../services/themeService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "themes" | "backgrounds";

const PRESET_BACKGROUNDS: {
  id: string;
  name: string;
  url: string;
  previewColor: string;
}[] = [
  {
    id: "cosmic",
    name: "Cosmic Nebula",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop",
    previewColor: "linear-gradient(135deg, #1f1a3a, #382952, #1b2838)",
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop",
    previewColor: "linear-gradient(135deg, #0f172a, #1e1b4b, #311042)",
  },
  {
    id: "aurora",
    name: "Aurora Borealis",
    url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=1920&auto=format&fit=crop",
    previewColor: "linear-gradient(135deg, #0d1f2d, #1d3557, #134e4a)",
  },
];

const THEME_PALETTES: {
  id: ThemePalette;
  name: string;
  desc: string;
  colors: string[];
}[] = [
  {
    id: "rose-pine",
    name: "Rosé Pine Moon Soho",
    desc: "Warm dark palette with pine accents & rose gold highlights",
    colors: ["#191724", "#eb6f92", "#f6c177", "#9ccfd8", "#c4a7e7"],
  },
  {
    id: "nord",
    name: "Nord Arctic Frost",
    desc: "Clean arctic palette with cool blues and muted snow tones",
    colors: ["#242933", "#88c0d0", "#81a1c1", "#ebcb8b", "#b48ead"],
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night Cyber",
    desc: "Deep neon palette celebrating the lights of downtown Tokyo",
    colors: ["#16161e", "#bb9af7", "#7dcfff", "#e0af68", "#f7768e"],
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("themes");
  const [currentPalette, setCurrentPaletteState] =
    useState<ThemePalette>("rose-pine");
  const [currentMode, setCurrentModeState] = useState<ThemeMode>("working");
  const [liveBg, setLiveBgState] = useState<string | null>(null);
  const [bgOpacity, setBgOpacityState] = useState<number>(0.3);
  const [bgBlur, setBgBlurState] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentPaletteState(getThemePalette());
      setCurrentModeState(getThemeMode());
      setLiveBgState(getLiveBackground());
      setBgOpacityState(getLiveBackgroundOpacity());
      setBgBlurState(getLiveBackgroundBlur());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPalette = (palette: ThemePalette) => {
    setCurrentPaletteState(palette);
    setThemePalette(palette);
  };

  const handleSelectMode = (mode: ThemeMode) => {
    setCurrentModeState(mode);
    setThemeMode(mode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLiveBgState(dataUrl);
        setLiveBackground(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSelectPreset = (url: string) => {
    setLiveBgState(url);
    setLiveBackground(url);
  };

  const handleClearBackground = () => {
    setLiveBgState(null);
    setLiveBackground(null);
  };

  const handleOpacityChange = (val: number) => {
    setBgOpacityState(val);
    setLiveBackgroundOpacity(val);
  };

  const handleBlurChange = (val: number) => {
    setBgBlurState(val);
    setLiveBackgroundBlur(val);
  };

  return (
    <div
      data-testid="settings-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        data-testid="settings-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "560px",
          maxHeight: "85vh",
          backgroundColor: "var(--rose-bg-surface)",
          border: "1px solid var(--rose-border-color)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--rose-shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--rose-text)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(110, 106, 134, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--rose-bg-base)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings size={18} color="var(--rose-pink)" />
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                margin: 0,
              }}
            >
              Vault Settings
            </h2>
          </div>
          <button
            data-testid="settings-close-btn"
            onClick={onClose}
            className="tactile-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--rose-subtle)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(110, 106, 134, 0.2)",
            backgroundColor: "var(--rose-bg-overlay)",
            padding: "0 16px",
          }}
        >
          <button
            data-testid="settings-tab-themes"
            onClick={() => setActiveTab("themes")}
            style={{
              padding: "12px 16px",
              border: "none",
              borderBottom:
                activeTab === "themes"
                  ? "2px solid var(--rose-pink)"
                  : "2px solid transparent",
              background: "transparent",
              color:
                activeTab === "themes"
                  ? "var(--rose-pink)"
                  : "var(--rose-subtle)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Palette size={15} />
            <span>Themes</span>
          </button>
          <button
            data-testid="settings-tab-backgrounds"
            onClick={() => setActiveTab("backgrounds")}
            style={{
              padding: "12px 16px",
              border: "none",
              borderBottom:
                activeTab === "backgrounds"
                  ? "2px solid var(--rose-foam)"
                  : "2px solid transparent",
              background: "transparent",
              color:
                activeTab === "backgrounds"
                  ? "var(--rose-foam)"
                  : "var(--rose-subtle)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ImageIcon size={15} />
            <span>Live Background</span>
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {activeTab === "themes" ? (
            <>
              {/* Color Palettes Section */}
              <div>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--rose-subtle)",
                    marginBottom: "12px",
                  }}
                >
                  Color Palette
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {THEME_PALETTES.map((palette) => {
                    const isSelected = currentPalette === palette.id;
                    return (
                      <div
                        key={palette.id}
                        data-testid={`theme-option-${palette.id}`}
                        onClick={() => handleSelectPalette(palette.id)}
                        className="tactile-card"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "var(--radius-md)",
                          border: isSelected
                            ? "1px solid var(--rose-pink)"
                            : "1px solid rgba(110, 106, 134, 0.25)",
                          backgroundColor: isSelected
                            ? "rgba(235, 111, 146, 0.12)"
                            : "var(--rose-bg-overlay)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span style={{ fontSize: "14px", fontWeight: 700 }}>
                              {palette.name}
                            </span>
                            {isSelected && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  backgroundColor: "var(--rose-pink)",
                                  color: "var(--rose-bg-base)",
                                  padding: "1px 6px",
                                  borderRadius: "10px",
                                }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--rose-subtle)",
                            }}
                          >
                            {palette.desc}
                          </span>
                        </div>

                        {/* Swatches */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {palette.colors.map((c, i) => (
                            <div
                              key={i}
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: c,
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mode Toggle Section */}
              <div
                style={{
                  borderTop: "1px solid rgba(110, 106, 134, 0.2)",
                  paddingTop: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--rose-subtle)",
                    marginBottom: "12px",
                  }}
                >
                  Interface Mode
                </h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    data-testid="mode-option-working"
                    onClick={() => handleSelectMode("working")}
                    className="tactile-btn"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border:
                        currentMode === "working"
                          ? "1px solid var(--rose-foam)"
                          : "1px solid rgba(110, 106, 134, 0.25)",
                      backgroundColor:
                        currentMode === "working"
                          ? "rgba(156, 207, 216, 0.15)"
                          : "var(--rose-bg-overlay)",
                      color:
                        currentMode === "working"
                          ? "var(--rose-foam)"
                          : "var(--rose-text)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>
                      Working Mode
                    </span>
                    <span
                      style={{ fontSize: "11px", color: "var(--rose-subtle)" }}
                    >
                      Modern Plus Jakarta Sans font
                    </span>
                  </button>
                  <button
                    data-testid="mode-option-arcade"
                    onClick={() => handleSelectMode("arcade")}
                    className="tactile-btn"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border:
                        currentMode === "arcade"
                          ? "1px solid var(--rose-pink)"
                          : "1px solid rgba(110, 106, 134, 0.25)",
                      backgroundColor:
                        currentMode === "arcade"
                          ? "rgba(235, 111, 146, 0.15)"
                          : "var(--rose-bg-overlay)",
                      color:
                        currentMode === "arcade"
                          ? "var(--rose-pink)"
                          : "var(--rose-text)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-pixel)",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      Arcade Mode
                    </span>
                    <span
                      style={{ fontSize: "11px", color: "var(--rose-subtle)" }}
                    >
                      Pixelify Sans retro aesthetic
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Live Background Section */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--rose-subtle)",
                      margin: 0,
                    }}
                  >
                    Live Background Image / GIF
                  </h3>
                  {liveBg && (
                    <button
                      data-testid="bg-clear-btn"
                      onClick={handleClearBackground}
                      className="tactile-btn"
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        color: "var(--rose-love)",
                        background: "rgba(235, 111, 146, 0.15)",
                        border: "1px solid rgba(235, 111, 146, 0.3)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Remove Background</span>
                    </button>
                  )}
                </div>

                {/* Upload Local File */}
                <div style={{ marginBottom: "16px" }}>
                  <input
                    type="file"
                    data-testid="bg-upload-input"
                    ref={fileInputRef}
                    accept="image/*,.gif,.png,.jpg,.jpeg,.webp"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                  <button
                    data-testid="bg-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="tactile-btn"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--rose-foam)",
                      backgroundColor: "rgba(156, 207, 216, 0.08)",
                      color: "var(--rose-foam)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    <Upload size={16} />
                    <span>Upload Local Image or Animated GIF</span>
                  </button>
                </div>

                {/* Presets */}
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--rose-subtle)",
                    marginBottom: "8px",
                  }}
                >
                  Or choose a preset backdrop:
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <button
                    data-testid="bg-preset-none"
                    onClick={handleClearBackground}
                    className="tactile-card"
                    style={{
                      height: "70px",
                      borderRadius: "var(--radius-md)",
                      border: !liveBg
                        ? "2px solid var(--rose-pink)"
                        : "1px solid rgba(110, 106, 134, 0.25)",
                      backgroundColor: "var(--rose-bg-overlay)",
                      color: "var(--rose-text)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    <X size={16} />
                    <span>None (Solid)</span>
                  </button>
                  {PRESET_BACKGROUNDS.map((preset) => {
                    const isSelected = liveBg === preset.url;
                    return (
                      <button
                        key={preset.id}
                        data-testid={`bg-preset-${preset.id}`}
                        onClick={() => handleSelectPreset(preset.url)}
                        className="tactile-card"
                        style={{
                          height: "70px",
                          borderRadius: "var(--radius-md)",
                          border: isSelected
                            ? "2px solid var(--rose-pink)"
                            : "1px solid rgba(110, 106, 134, 0.25)",
                          background: preset.previewColor,
                          color: "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Sparkles size={14} />
                        <span>{preset.name}</span>
                        {isSelected && (
                          <div
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              backgroundColor: "var(--rose-pink)",
                              borderRadius: "50%",
                              padding: "2px",
                              display: "flex",
                            }}
                          >
                            <Check size={10} color="#fff" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Background Adjustments */}
                {liveBg && (
                  <div
                    style={{
                      borderTop: "1px solid rgba(110, 106, 134, 0.2)",
                      paddingTop: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        <span>Backdrop Opacity</span>
                        <span
                          style={{ color: "var(--rose-foam)", fontWeight: 700 }}
                        >
                          {Math.round(bgOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        data-testid="bg-opacity-slider"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={bgOpacity}
                        onChange={(e) =>
                          handleOpacityChange(parseFloat(e.target.value))
                        }
                        style={{
                          width: "100%",
                          accentColor: "var(--rose-foam)",
                        }}
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        <span>Backdrop Blur</span>
                        <span
                          style={{ color: "var(--rose-pink)", fontWeight: 700 }}
                        >
                          {bgBlur}px
                        </span>
                      </div>
                      <input
                        type="range"
                        data-testid="bg-blur-slider"
                        min="0"
                        max="20"
                        step="1"
                        value={bgBlur}
                        onChange={(e) =>
                          handleBlurChange(parseInt(e.target.value, 10))
                        }
                        style={{
                          width: "100%",
                          accentColor: "var(--rose-pink)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
