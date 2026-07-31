import React from "react";

interface EditorPaneProps {
  filename?: string;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  filename = "workspace-note.md",
}) => {
  return (
    <main
      style={{
        flex: 1,
        height: "100%",
        backgroundColor: "var(--rose-bg-base)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Editor Header / Status Bar */}
      <div
        style={{
          height: "44px",
          padding: "0 20px",
          borderBottom: "1px solid rgba(110, 106, 134, 0.2)",
          backgroundColor: "var(--rose-bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px" }}>📝</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--rose-rose)",
            }}
          >
            {filename}
          </span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: "rgba(156, 207, 216, 0.15)",
              color: "var(--rose-foam)",
            }}
          >
            Markdown
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "11px",
            color: "var(--rose-subtle)",
          }}
        >
          <span>5 Tasks (1 Completed)</span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--rose-foam)",
              }}
            />
            Ready
          </span>
        </div>
      </div>

      {/* Editor Document Container Shell */}
      <div
        style={{
          flex: 1,
          padding: "32px 40px",
          overflowY: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          lineHeight: "1.7",
          color: "var(--rose-text)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "24px",
            color: "var(--rose-pink)",
            marginBottom: "16px",
            fontWeight: 700,
          }}
        >
          # Workspace Project Roadmap
        </h1>

        <p style={{ color: "var(--rose-subtle)", marginBottom: "20px" }}>
          Welcome to the Rosé Pine Moon Soho Checklist app. Tasks within plain
          Markdown files are automatically aggregated into the Task Dashboard on
          the left sidebar.
        </p>

        <h2
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "18px",
            color: "var(--rose-gold)",
            marginTop: "24px",
            marginBottom: "12px",
          }}
        >
          ## Immediate Milestones
        </h2>

        <div
          style={{
            padding: "16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--rose-bg-surface)",
            border: "1px solid rgba(110, 106, 134, 0.2)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(156, 207, 216, 0.2)",
                color: "var(--rose-foam)",
              }}
            >
              [x] COMPLETED
            </span>
            <span>Set up Dual Column layout shell with Rosé Pine tokens</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(246, 193, 119, 0.2)",
                color: "var(--rose-gold)",
              }}
            >
              [-] IN PROGRESS
            </span>
            <span>
              Integrate Tauri file system commands for reading/writing markdown
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(196, 167, 231, 0.2)",
                color: "var(--rose-iris)",
              }}
            >
              [ ] OPEN
            </span>
            <span>
              Lexical editor Markdown transformer & DecoratorNode integration
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(235, 111, 146, 0.2)",
                color: "var(--rose-pink)",
              }}
            >
              [&gt;] BLOCKED
            </span>
            <span>Custom interactive checklist portal node renderer</span>
          </div>
        </div>
      </div>
    </main>
  );
};
