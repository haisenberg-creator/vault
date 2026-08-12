import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnvironment } from "../../services/fileService";

export interface TitleBarProps {
  activeFilename?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeFilename = "workspace-note.md",
}) => {
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
      {/* Left: Brand Lectern Icon + App Title + Active File Badge */}
      <div
        data-tauri-drag-region
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {/* Lectern / Book Icon */}
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
          }}
        >
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </svg>

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

        <span style={{ color: "var(--rose-muted)", fontSize: "12px" }}>/</span>

        <span
          style={{
            fontSize: "11px",
            color: "var(--rose-subtle)",
            backgroundColor: "rgba(38, 35, 58, 0.6)",
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(110, 106, 134, 0.2)",
          }}
        >
          {activeFilename}
        </span>
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
            gap: "4px",
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
    </div>
  );
};
