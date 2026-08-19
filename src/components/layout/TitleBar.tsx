import React, { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import bookIcon from "../../assets/book.png";
import enchantedBookIcon from "../../assets/enchanted-book.png";
import {
  isTauriEnvironment,
  formatShortPath,
  resolveAbsolutePath,
  copyToClipboard,
  revealFileInExplorer,
} from "../../services/fileService";
import { ThemeMode } from "../../services/themeService";

export interface TitleBarProps {
  activeFilename?: string;
  workspaceDir?: string;
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeFilename = "workspace-note.md",
  workspaceDir,
  themeMode = "working",
  onToggleThemeMode,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleIconContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeFilename || !activeFilename.trim()) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: Math.max(8, rect.left),
    });
    setIsMenuOpen(true);
  };

  const handleCopyPath = async () => {
    const fullPath = resolveAbsolutePath(activeFilename, workspaceDir);
    await copyToClipboard(fullPath);
    setIsMenuOpen(false);
  };

  const handleCopyRelativePath = async () => {
    const relPath = formatShortPath(activeFilename, workspaceDir);
    await copyToClipboard(relPath);
    setIsMenuOpen(false);
  };

  const handleRevealFile = async () => {
    await revealFileInExplorer(activeFilename, workspaceDir);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isMenuOpen]);

  const handleMinimize = async () => {
    if (!isTauriEnvironment()) {
      console.info("[TitleBar] Minimize clicked in browser dev mode.");
      return;
    }
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (err) {
      console.warn("Minimize window call failed:", err);
    }
  };

  const handleMaximize = async () => {
    if (!isTauriEnvironment()) {
      console.info("[TitleBar] Maximize clicked in browser dev mode.");
      return;
    }
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch (err) {
      console.warn("Maximize window call failed:", err);
    }
  };

  const handleClose = async () => {
    if (!isTauriEnvironment()) {
      console.info("[TitleBar] Close clicked in browser dev mode.");
      return;
    }
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (err) {
      console.warn("Close window call failed:", err);
    }
  };

  return (
    <div
      style={{
        height: "36px",
        backgroundColor: "rgba(25, 23, 36, 0.95)",
        borderBottom: "1px solid rgba(110, 106, 134, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px 0 12px",
        userSelect: "none",
        WebkitUserSelect: "none",
        width: "100%",
        boxSizing: "border-box",
        zIndex: 1000,
      }}
    >
      {/* Left: Brand Lectern Icon + App Title + Mode Toggle */}
      <div
        style={
          {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            WebkitAppRegion: "no-drag",
          } as React.CSSProperties
        }
      >
        {/* Lectern / Book Icon with Context Menu */}
        <div
          data-testid="titlebar-note-icon"
          onContextMenu={handleIconContextMenu}
          title={
            activeFilename
              ? "Right-click for options (Copy Path, Reveal in Explorer)"
              : "Vault"
          }
          style={
            {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: activeFilename ? "context-menu" : "default",
              pointerEvents: "auto",
              WebkitAppRegion: "no-drag",
              borderRadius: "4px",
              padding: "2px",
            } as React.CSSProperties
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: "var(--rose-pink)",
              filter: "drop-shadow(0 0 3px var(--rose-pink))",
              pointerEvents: "none",
            }}
          >
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M12 11h4" />
            <path d="M12 16h4" />
            <path d="M8 11h.01" />
            <path d="M8 16h.01" />
          </svg>
        </div>

        <span
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: "var(--rose-text)",
          }}
        >
          VAULT
        </span>

        {/* Mode Toggle Button positioned directly next to VAULT title */}
        <button
          data-testid="theme-mode-toggle-btn"
          onClick={onToggleThemeMode}
          className="tactile-btn"
          style={
            {
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              border:
                themeMode === "arcade"
                  ? "1px solid var(--rose-pink)"
                  : "1px solid rgba(110, 106, 134, 0.3)",
              backgroundColor:
                themeMode === "arcade"
                  ? "rgba(235, 111, 146, 0.2)"
                  : "rgba(38, 35, 58, 0.6)",
              color:
                themeMode === "arcade"
                  ? "var(--rose-pink)"
                  : "var(--rose-text)",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              pointerEvents: "auto",
              WebkitAppRegion: "no-drag",
            } as React.CSSProperties
          }
          title={
            themeMode === "arcade"
              ? "Switch to Working Mode"
              : "Switch to Arcade Mode"
          }
        >
          {themeMode === "arcade" ? (
            <>
              <img
                src={enchantedBookIcon}
                alt="Arcade Mode Icon"
                style={{
                  width: "14px",
                  height: "14px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 4px var(--rose-pink))",
                }}
              />
              <span>ARCADE</span>
            </>
          ) : (
            <>
              <img
                src={bookIcon}
                alt="Working Mode Icon"
                style={{
                  width: "14px",
                  height: "14px",
                  objectFit: "contain",
                }}
              />
              <span>WORKING</span>
            </>
          )}
        </button>
      </div>

      {/* Middle: Draggable space */}
      <div
        data-tauri-drag-region
        style={{
          flex: 1,
          height: "100%",
        }}
      />

      {/* Right: Window Controls */}
      <div
        style={
          {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            WebkitAppRegion: "no-drag",
          } as React.CSSProperties
        }
      >
        <button
          data-testid="window-minimize"
          onClick={handleMinimize}
          className="tactile-btn"
          style={
            {
              width: "28px",
              height: "24px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--rose-subtle)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              WebkitAppRegion: "no-drag",
            } as React.CSSProperties
          }
          title="Minimize Window"
        >
          &#8212;
        </button>

        <button
          data-testid="window-maximize"
          onClick={handleMaximize}
          className="tactile-btn"
          style={
            {
              width: "28px",
              height: "24px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--rose-subtle)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              WebkitAppRegion: "no-drag",
            } as React.CSSProperties
          }
          title="Maximize Window"
        >
          &#9633;
        </button>

        <button
          data-testid="window-close"
          onClick={handleClose}
          className="tactile-btn"
          style={
            {
              width: "28px",
              height: "24px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--rose-subtle)",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              WebkitAppRegion: "no-drag",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(235, 111, 146, 0.25)";
            e.currentTarget.style.color = "var(--rose-pink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--rose-subtle)";
          }}
          title="Close Window"
        >
          &#10005;
        </button>
      </div>

      {/* Context Menu Modal / Popup */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          data-testid="titlebar-context-menu"
          style={
            {
              position: "fixed",
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              backgroundColor: "rgba(35, 33, 54, 0.98)",
              border: "1px solid rgba(110, 106, 134, 0.3)",
              borderRadius: "6px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
              padding: "4px 0",
              zIndex: 9999,
              minWidth: "190px",
              display: "flex",
              flexDirection: "column",
              userSelect: "none",
              WebkitAppRegion: "no-drag",
              backdropFilter: "blur(8px)",
            } as React.CSSProperties
          }
        >
          <button
            data-testid="menu-item-copy-path"
            onClick={handleCopyPath}
            className="tactile-btn"
            style={
              {
                padding: "6px 12px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--rose-text)",
                fontSize: "12px",
                fontFamily: "var(--font-sans, inherit)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.15s ease, color 0.15s ease",
                WebkitAppRegion: "no-drag",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(235, 111, 146, 0.15)";
              e.currentTarget.style.color = "var(--rose-pink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--rose-text)";
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.8 }}
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy Path</span>
          </button>

          <button
            data-testid="menu-item-copy-relative-path"
            onClick={handleCopyRelativePath}
            className="tactile-btn"
            style={
              {
                padding: "6px 12px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--rose-text)",
                fontSize: "12px",
                fontFamily: "var(--font-sans, inherit)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.15s ease, color 0.15s ease",
                WebkitAppRegion: "no-drag",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(235, 111, 146, 0.15)";
              e.currentTarget.style.color = "var(--rose-pink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--rose-text)";
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.8 }}
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Copy Relative Path</span>
          </button>

          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(110, 106, 134, 0.2)",
              margin: "3px 0",
            }}
          />

          <button
            data-testid="menu-item-reveal-file"
            onClick={handleRevealFile}
            className="tactile-btn"
            style={
              {
                padding: "6px 12px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--rose-text)",
                fontSize: "12px",
                fontFamily: "var(--font-sans, inherit)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.15s ease, color 0.15s ease",
                WebkitAppRegion: "no-drag",
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(235, 111, 146, 0.15)";
              e.currentTarget.style.color = "var(--rose-pink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--rose-text)";
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.8 }}
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Reveal in File Explorer</span>
          </button>
        </div>
      )}
    </div>
  );
};
