import { useState, useEffect } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";

export default function UpdateNotification() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function checkForUpdate() {
      try {
        const u = await check();
        if (u) {
          setUpdate(u);
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    }
    checkForUpdate();
  }, []);

  const handleInstall = async () => {
    if (!update) return;
    setDownloading(true);
    try {
      await update.downloadAndInstall();
      // App will automatically restart after installation
    } catch (error) {
      console.error("Failed to install update:", error);
      setDownloading(false);
    }
  };

  if (!update) return null;

  return (
    <div
      className="tactile-card rose-glow-animated"
      style={{
        position: "absolute",
        bottom: "24px",
        right: "24px",
        backgroundColor: "var(--rose-bg-surface)",
        border: "1px solid var(--rose-pink)",
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--rose-shadow)",
        zIndex: 9999,
        maxWidth: "320px",
      }}
    >
      <h3
        style={{
          color: "var(--rose-rose)",
          marginBottom: "8px",
          fontSize: "16px",
          marginTop: 0,
        }}
      >
        Update Available!
      </h3>
      <p
        style={{
          color: "var(--rose-text)",
          fontSize: "14px",
          marginBottom: "16px",
          lineHeight: "1.4",
        }}
      >
        Version {update.version} is ready to install. Would you like to download
        and restart now?
      </p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={() => setUpdate(null)}
          disabled={downloading}
          className="tactile-btn"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--rose-subtle)",
            cursor: "pointer",
            padding: "8px 12px",
            fontSize: "13px",
          }}
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          disabled={downloading}
          className="tactile-btn"
          style={{
            background: "var(--rose-pine)",
            color: "var(--rose-bg-base)",
            border: "none",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            cursor: downloading ? "wait" : "pointer",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {downloading ? "Installing..." : "Install Now"}
        </button>
      </div>
    </div>
  );
}
