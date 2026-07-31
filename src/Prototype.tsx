import { useState, useEffect } from "react";

// Types for prototype data
interface ChecklistItem {
  id: string;
  text: string;
  state: "open" | "in_progress" | "blocked" | "completed";
}

const SAMPLE_TASKS: ChecklistItem[] = [
  { id: "1", text: "Scaffold Tauri + React Vite app", state: "completed" },
  {
    id: "2",
    text: "Select rich text editor framework (Lexical)",
    state: "completed",
  },
  {
    id: "3",
    text: "Implement custom Lexical DecoratorNode for Checklists",
    state: "in_progress",
  },
  {
    id: "4",
    text: "Integrate Rust file system watcher for local .md files",
    state: "blocked",
  },
  {
    id: "5",
    text: "Add smooth CSS animations for task completion",
    state: "open",
  },
];

const SAMPLE_FILES = [
  "daily-todo.md",
  "project-roadmap.md",
  "meeting-notes.md",
  "shopping-list.md",
];

// Helper Badge component for Checklist Item State
function StateBadge({
  state,
  onClick,
}: {
  state: ChecklistItem["state"];
  onClick?: () => void;
}) {
  const styles: Record<
    ChecklistItem["state"],
    { bg: string; color: string; label: string }
  > = {
    open: { bg: "#3b82f620", color: "#60a5fa", label: "Open" },
    in_progress: { bg: "#f59e0b20", color: "#fbbf24", label: "In Progress" },
    blocked: { bg: "#ef444420", color: "#f87171", label: "Blocked" },
    completed: { bg: "#10b98120", color: "#34d399", label: "Completed" },
  };
  const current = styles[state];

  return (
    <span
      onClick={onClick}
      style={{
        backgroundColor: current.bg,
        color: current.color,
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        border: `1px solid ${current.color}40`,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {current.label}
    </span>
  );
}

// -----------------------------------------------------------------------------
// VARIANT A: Notepad++ Classic (Tabs + Sidebar File Tree)
// -----------------------------------------------------------------------------
function VariantA() {
  const [activeTab, setActiveTab] = useState("daily-todo.md");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        width: "100%",
        background: "#1e1e2e",
        color: "#cdd6f4",
        textAlign: "left",
        fontFamily: "sans-serif",
      }}
    >
      {/* Left Sidebar */}
      {sidebarOpen && (
        <div
          style={{
            width: "240px",
            background: "#181825",
            borderRight: "1px solid #313244",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#a6adc8",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Workspace Files
          </div>
          {SAMPLE_FILES.map((file) => (
            <div
              key={file}
              onClick={() => setActiveTab(file)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
                background: activeTab === file ? "#313244" : "transparent",
                color: activeTab === file ? "#89b4fa" : "#cdd6f4",
                marginBottom: "4px",
              }}
            >
              📄 {file}
            </div>
          ))}
        </div>
      )}

      {/* Main Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Tab Bar */}
        <div
          style={{
            display: "flex",
            background: "#11111b",
            borderBottom: "1px solid #313244",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              color: "#a6adc8",
              cursor: "pointer",
              borderRight: "1px solid #313244",
            }}
          >
            {sidebarOpen ? "◀" : "▶ Sidebar"}
          </button>
          {SAMPLE_FILES.map((file) => (
            <div
              key={file}
              onClick={() => setActiveTab(file)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                borderRight: "1px solid #313244",
                background: activeTab === file ? "#1e1e2e" : "#181825",
                color: activeTab === file ? "#cdd6f4" : "#6c7086",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{file}</span>
              {activeTab === file && (
                <span style={{ fontSize: "10px", opacity: 0.6 }}>✕</span>
              )}
            </div>
          ))}
        </div>

        {/* Editor Area */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          <h2 style={{ marginTop: 0, color: "#89b4fa" }}>{activeTab}</h2>
          <p style={{ color: "#a6adc8", fontSize: "14px" }}>
            This is a Notepad++ style multi-tab layout with an optional
            workspace sidebar.
          </p>

          <div
            style={{
              background: "#181825",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #313244",
              marginTop: "16px",
            }}
          >
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                color: "#cba6f7",
              }}
            >
              Interactive Checklist Items:
            </h4>
            {SAMPLE_TASKS.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #313244",
                }}
              >
                <span
                  style={{
                    textDecoration:
                      task.state === "completed" ? "line-through" : "none",
                    color: task.state === "completed" ? "#6c7086" : "#cdd6f4",
                  }}
                >
                  {task.text}
                </span>
                <StateBadge state={task.state} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// VARIANT B: Zen Focus Mode (Single Document + Command Palette)
// -----------------------------------------------------------------------------
function VariantB() {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div
      style={{
        height: "calc(100vh - 60px)",
        width: "100%",
        background: "#11111b",
        color: "#cdd6f4",
        textAlign: "left",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Subtle Top Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{ fontSize: "13px", color: "#6c7086", fontWeight: "bold" }}
        >
          ZEN MODE
        </span>
        <button
          onClick={() => setCmdOpen(true)}
          style={{
            background: "#1e1e2e",
            border: "1px solid #313244",
            color: "#a6adc8",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          ⌘K Quick Open
        </button>
      </div>

      {/* Main Single Document */}
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          flex: 1,
          padding: "0 24px 40px 24px",
          overflowY: "auto",
        }}
      >
        <input
          defaultValue="Daily Focus & Tasks"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            fontSize: "32px",
            fontWeight: "bold",
            color: "#f5c2e7",
            outline: "none",
            marginBottom: "16px",
          }}
        />
        <p style={{ color: "#a6adc8", fontSize: "16px", lineHeight: "1.6" }}>
          Clean, distraction-free document editor. Zero visible sidebars or
          tabs. Everything is controlled via keyboard shortcuts or floating
          command palette.
        </p>

        <div style={{ marginTop: "24px" }}>
          {SAMPLE_TASKS.map((task) => (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderBottom: "1px dashed #313244",
              }}
            >
              <StateBadge state={task.state} />
              <span
                style={{
                  fontSize: "15px",
                  color: task.state === "completed" ? "#6c7086" : "#cdd6f4",
                  textDecoration:
                    task.state === "completed" ? "line-through" : "none",
                }}
              >
                {task.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Command Palette Modal */}
      {cmdOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            paddingTop: "100px",
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: "500px",
              background: "#1e1e2e",
              border: "1px solid #45475a",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <input
                autoFocus
                placeholder="Search notes or commands..."
                style={{
                  width: "100%",
                  background: "#181825",
                  border: "1px solid #313244",
                  color: "#cdd6f4",
                  padding: "10px",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => setCmdOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#a6adc8",
                  marginLeft: "8px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#a6adc8",
                marginBottom: "8px",
              }}
            >
              Recent Files
            </div>
            {SAMPLE_FILES.map((file) => (
              <div
                key={file}
                onClick={() => setCmdOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#181825",
                  marginBottom: "4px",
                  color: "#89b4fa",
                }}
              >
                📄 {file}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// VARIANT C: Dual Column (Kanban Dashboard + Note Editor)
// -----------------------------------------------------------------------------
function VariantC() {
  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        width: "100%",
        background: "#181825",
        color: "#cdd6f4",
        textAlign: "left",
        fontFamily: "sans-serif",
      }}
    >
      {/* Left Column: Task Overview across all notes */}
      <div
        style={{
          width: "360px",
          background: "#11111b",
          borderRight: "1px solid #313244",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          style={{ margin: "0 0 16px 0", color: "#f9e2af", fontSize: "16px" }}
        >
          ⚡ Task Dashboard
        </h3>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#f87171",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Blocked Tasks
            </div>
            {SAMPLE_TASKS.filter((t) => t.state === "blocked").map((t) => (
              <div
                key={t.id}
                style={{
                  background: "#1e1e2e",
                  padding: "10px",
                  borderRadius: "6px",
                  borderLeft: "3px solid #ef4444",
                  fontSize: "13px",
                }}
              >
                {t.text}
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#fbbf24",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              In Progress
            </div>
            {SAMPLE_TASKS.filter((t) => t.state === "in_progress").map((t) => (
              <div
                key={t.id}
                style={{
                  background: "#1e1e2e",
                  padding: "10px",
                  borderRadius: "6px",
                  borderLeft: "3px solid #f59e0b",
                  fontSize: "13px",
                }}
              >
                {t.text}
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#60a5fa",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Open Tasks
            </div>
            {SAMPLE_TASKS.filter((t) => t.state === "open").map((t) => (
              <div
                key={t.id}
                style={{
                  background: "#1e1e2e",
                  padding: "10px",
                  borderRadius: "6px",
                  borderLeft: "3px solid #3b82f6",
                  fontSize: "13px",
                }}
              >
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Note Editor */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        <h2 style={{ marginTop: 0, color: "#89b4fa" }}>
          Active Note: project-roadmap.md
        </h2>
        <p style={{ color: "#a6adc8" }}>
          This layout gives you a dedicated left pane summarizing all stateful
          tasks from your markdown notes, alongside your active editor.
        </p>

        <div
          style={{
            background: "#11111b",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #313244",
          }}
        >
          {SAMPLE_TASKS.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <StateBadge state={t.state} />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// VARIANT D: Obsidian Slate Design System (Tokenized & Styled Dual Column)
// -----------------------------------------------------------------------------
const ENGLISH_SAMPLE_TASKS: ChecklistItem[] = [
  {
    id: "1",
    text: "Scaffold Tauri + React Vite desktop application",
    state: "completed",
  },
  {
    id: "2",
    text: "Select Lexical editor framework for custom note rendering",
    state: "completed",
  },
  {
    id: "3",
    text: "Apply Cozy Pixel design system (Pixelify Sans & JetBrains Mono)",
    state: "in_progress",
  },
  {
    id: "4",
    text: "Verify Vietnamese font compatibility: Tiếng Việt (Ắ, Ằ, Ể, Ố, Ự)",
    state: "open",
  },
  {
    id: "5",
    text: "Integrate Rust file system watcher for local .md files",
    state: "blocked",
  },
];

function VariantD() {
  const [tasks, setTasks] = useState(ENGLISH_SAMPLE_TASKS);

  const toggleTaskState = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextState: Record<
          ChecklistItem["state"],
          ChecklistItem["state"]
        > = {
          open: "in_progress",
          in_progress: "completed",
          completed: "open",
          blocked: "open",
        };
        return { ...t, state: nextState[t.state] };
      })
    );
  };

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        width: "100%",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-ui)",
        textAlign: "left",
      }}
    >
      {/* Left Column: Task Overview across all notes */}
      <div
        style={{
          width: "360px",
          background: "var(--bg-base)",
          borderRight: "var(--border-subtle)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <h3
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Global Task Dashboard
          </h3>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
          Tokens: Obsidian Slate theme. Click badge or task to toggle state.
        </p>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--accent-danger)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Blocked Tasks
            </div>
            {tasks
              .filter((t) => t.state === "blocked")
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskState(t.id)}
                  style={{
                    background: "var(--bg-surface)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    borderLeft: "3px solid var(--accent-danger)",
                    borderTop: "var(--border-subtle)",
                    borderRight: "var(--border-subtle)",
                    borderBottom: "var(--border-subtle)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                    marginBottom: "6px",
                  }}
                >
                  {t.text}
                </div>
              ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--accent-warning)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              In Progress
            </div>
            {tasks
              .filter((t) => t.state === "in_progress")
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskState(t.id)}
                  style={{
                    background: "var(--bg-surface)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    borderLeft: "3px solid var(--accent-warning)",
                    borderTop: "var(--border-subtle)",
                    borderRight: "var(--border-subtle)",
                    borderBottom: "var(--border-subtle)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                    marginBottom: "6px",
                  }}
                >
                  {t.text}
                </div>
              ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--primary)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Open Tasks
            </div>
            {tasks
              .filter((t) => t.state === "open")
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskState(t.id)}
                  style={{
                    background: "var(--bg-surface)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    borderLeft: "3px solid var(--primary)",
                    borderTop: "var(--border-subtle)",
                    borderRight: "var(--border-subtle)",
                    borderBottom: "var(--border-subtle)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                    marginBottom: "6px",
                  }}
                >
                  {t.text}
                </div>
              ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--accent-success)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Completed
            </div>
            {tasks
              .filter((t) => t.state === "completed")
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskState(t.id)}
                  style={{
                    background: "var(--bg-surface)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    borderLeft: "3px solid var(--accent-success)",
                    borderTop: "var(--border-subtle)",
                    borderRight: "var(--border-subtle)",
                    borderBottom: "var(--border-subtle)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                    marginBottom: "6px",
                  }}
                >
                  {t.text}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Right Column: Note Editor */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          background: "var(--bg-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <h2
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Active Note: project-roadmap.md
          </h2>
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          Demonstrating Obsidian Slate tokens with JetBrains Mono editor
          simulation and interactive Lexical task nodes.
        </p>

        <div
          style={{
            background: "var(--bg-base)",
            padding: "20px",
            borderRadius: "var(--radius-lg)",
            border: "var(--border-subtle)",
            boxShadow: "var(--shadow-elevation-1)",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          <div style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
            # Project Roadmap & Checklist
          </div>

          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTaskState(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "var(--transition-fast)",
                background:
                  t.state === "completed"
                    ? "var(--accent-success-bg)"
                    : "transparent",
                marginBottom: "4px",
              }}
            >
              <StateBadge state={t.state} />
              <span
                style={{
                  color:
                    t.state === "completed"
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  textDecoration:
                    t.state === "completed" ? "line-through" : "none",
                  transition: "var(--transition-fast)",
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// VARIANT E1: Cyberpunk Neon Pink & Obsidian Black
// -----------------------------------------------------------------------------
function VariantE1() {
  const [tasks, setTasks] = useState(ENGLISH_SAMPLE_TASKS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleTaskState = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, state: t.state === "completed" ? "open" : "completed" }
          : t
      )
    );
  };

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        width: "100%",
        background: "var(--cyber-bg-base)",
        color: "#F4F4F5",
        fontFamily: "var(--font-pixel)",
        textAlign: "left",
      }}
    >
      {/* Left Column */}
      <div
        style={{
          width: "380px",
          background: "var(--cyber-bg-base)",
          borderRight: "var(--cyber-border)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "var(--cyber-pink)",
            color: "#000000",
            padding: "12px 16px",
            border: "2px solid #FFFFFF",
            boxShadow: "4px 4px 0px #FF2BD6",
            borderRadius: "2px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            ⚡ CYBERPUNK QUEST LOG
          </h3>
          <div style={{ fontSize: "11px", opacity: 0.9 }}>
            Theme 1: Neon Pink (#FF2BD6) & Obsidian (#0A0A0E)
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTaskState(t.id)}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: "var(--cyber-bg-surface)",
                padding: "12px 14px",
                border: "var(--cyber-border)",
                boxShadow:
                  hoveredId === t.id
                    ? "1px 1px 0px #FF2BD6"
                    : "var(--cyber-shadow)",
                transform: hoveredId === t.id ? "translate(2px, 2px)" : "none",
                transition: "var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    background: "#FF2BD6",
                    color: "#000000",
                    padding: "2px 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {t.state.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", color: "#FF2BD6" }}>
                  TASK #{t.id}
                </span>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: t.state === "completed" ? "#666680" : "#FFFFFF",
                  textDecoration:
                    t.state === "completed" ? "line-through" : "none",
                }}
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column Editor */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          background: "var(--cyber-bg-surface)",
        }}
      >
        <div
          style={{
            background: "#14141E",
            border: "var(--cyber-border)",
            boxShadow: "var(--cyber-shadow)",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{ fontSize: "11px", color: "#FF2BD6", fontWeight: 700 }}
            >
              NEON MATRIX FILE
            </span>
            <h2 style={{ margin: 0, color: "#FFFFFF", fontSize: "20px" }}>
              📄 project-roadmap.md
            </h2>
          </div>
          <button
            style={{
              fontFamily: "var(--font-pixel)",
              background: "#FF2BD6",
              color: "#000000",
              border: "2px solid #FFFFFF",
              boxShadow: "2px 2px 0px #FF2BD6",
              padding: "8px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + ADD TASK
          </button>
        </div>

        <div
          style={{
            background: "#0A0A0E",
            padding: "24px",
            border: "var(--cyber-border)",
            boxShadow: "var(--cyber-shadow)",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
          }}
        >
          <div
            style={{
              color: "#FF2BD6",
              marginBottom: "16px",
              fontFamily: "var(--font-pixel)",
              fontSize: "16px",
            }}
          >
            # CYBERPUNK ROADMAP
          </div>
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTaskState(t.id)}
              style={{
                display: "flex",
                gap: "12px",
                padding: "8px 12px",
                border: "1px solid #FF2BD6",
                background: t.state === "completed" ? "#1A0017" : "#14141E",
                marginBottom: "8px",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#FF2BD6" }}>
                [{t.state === "completed" ? "X" : " "}]
              </span>
              <span
                style={{
                  color: t.state === "completed" ? "#888899" : "#F4F4F5",
                  textDecoration:
                    t.state === "completed" ? "line-through" : "none",
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// VARIANT E2: Rosé Pine Moon Soho Charcoal & Pink
// -----------------------------------------------------------------------------
function VariantE2() {
  const [tasks, setTasks] = useState(ENGLISH_SAMPLE_TASKS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);

  const toggleTaskState = (id: string) => {
    setClickedId(id);
    setTimeout(() => setClickedId(null), 300);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextState: Record<
          ChecklistItem["state"],
          ChecklistItem["state"]
        > = {
          open: "in_progress",
          in_progress: "completed",
          completed: "open",
          blocked: "open",
        };
        return { ...t, state: nextState[t.state] };
      })
    );
  };

  const completedCount = tasks.filter((t) => t.state === "completed").length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        width: "100%",
        background: "var(--rose-bg-base)",
        color: "#E0DEF4",
        fontFamily: "var(--font-pixel)",
        textAlign: "left",
      }}
    >
      {/* Left Column */}
      <div
        style={{
          width: "380px",
          background: "var(--rose-bg-base)",
          borderRight: "var(--rose-border)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Animated Glowing Header */}
        <div
          className="rose-glow-animated"
          style={{
            background: "#1F1D2E",
            color: "#EB6F92",
            padding: "14px 16px",
            border: "var(--rose-border)",
            borderRadius: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              🌙 ROSÉ SOHO QUEST LOG
            </h3>
            <span
              style={{
                background: "#EB6F92",
                color: "#191724",
                padding: "2px 6px",
                fontSize: "10px",
                fontWeight: 700,
                borderRadius: "3px",
              }}
            >
              LVL 2 MASTER
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#907AA9" }}>
            Lively Rosé Moon Soho Theme with Motion Physics
          </div>

          {/* Animated Progress Meter Bar */}
          <div style={{ marginTop: "4px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#E0DEF4",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              <span>PROGRESS</span>
              <span style={{ color: "#EB6F92" }}>
                {progressPercent}% ({completedCount}/{tasks.length})
              </span>
            </div>
            <div
              style={{
                height: "8px",
                background: "#191724",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid #31748F",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background:
                    "linear-gradient(90deg, #EB6F92 0%, #F6C177 100%)",
                  borderRadius: "4px",
                  transition: "width 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 10px rgba(235, 111, 146, 0.8)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Task Cards with Motion & Glow Physics */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            paddingRight: "4px",
          }}
        >
          {tasks.map((t) => {
            const isHovered = hoveredId === t.id;
            const isJustClicked = clickedId === t.id;
            const isDone = t.state === "completed";

            return (
              <div
                key={t.id}
                onClick={() => toggleTaskState(t.id)}
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={isJustClicked ? "badge-pop" : ""}
                style={{
                  background: isDone ? "#181622" : "var(--rose-bg-surface)",
                  padding: "14px 16px",
                  borderRadius: "6px",
                  border: isHovered ? "2px solid #EB6F92" : "2px solid #26233A",
                  boxShadow: isHovered
                    ? "0 8px 22px rgba(235, 111, 146, 0.3)"
                    : "var(--rose-shadow)",
                  transform: isHovered
                    ? "translateY(-3px) scale(1.01)"
                    : "translateY(0px) scale(1)",
                  transition: "all 180ms ease-out",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: isDone
                        ? "#31748F"
                        : t.state === "in_progress"
                          ? "#F6C177"
                          : t.state === "blocked"
                            ? "#EB6F92"
                            : "#9CCFD8",
                      color: "#191724",
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderRadius: "3px",
                      transition: "var(--transition-fast)",
                    }}
                  >
                    {t.state.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#907AA9",
                      fontWeight: 600,
                    }}
                  >
                    TASK #{t.id}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isDone ? "#6E6A86" : "#E0DEF4",
                    textDecoration: isDone ? "line-through" : "none",
                    transition: "var(--transition-fast)",
                  }}
                >
                  {t.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column Editor */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          background: "var(--rose-bg-surface)",
        }}
      >
        <div
          style={{
            background: "#191724",
            border: "var(--rose-border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            borderRadius: "6px",
            padding: "18px 22px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                color: "#EB6F92",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              ROSÉ PINE MOON LIVE EDITOR
            </span>
            <h2
              style={{
                margin: "2px 0 0 0",
                color: "#E0DEF4",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              📄 project-roadmap.md
            </h2>
          </div>
          <button
            className="rose-glow-animated"
            style={{
              fontFamily: "var(--font-pixel)",
              background: "#EB6F92",
              color: "#191724",
              border: "2px solid #EB6F92",
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: "4px",
              transition: "transform 150ms ease",
            }}
          >
            + NEW ITEM
          </button>
        </div>

        <div
          style={{
            background: "#191724",
            padding: "24px",
            borderRadius: "6px",
            border: "var(--rose-border)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            lineHeight: "1.7",
          }}
        >
          <div
            style={{
              color: "#EB6F92",
              marginBottom: "16px",
              fontFamily: "var(--font-pixel)",
              fontSize: "16px",
            }}
          >
            # ROSÉ PINE ROADMAP & CHECKLIST
          </div>
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTaskState(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                border:
                  t.state === "completed"
                    ? "1px solid #31748F"
                    : "1px solid #26233A",
                background:
                  t.state === "completed"
                    ? "rgba(49, 116, 143, 0.15)"
                    : "#1F1D2E",
                borderRadius: "4px",
                marginBottom: "8px",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              <span
                style={{
                  color: t.state === "completed" ? "#9CCFD8" : "#EB6F92",
                  fontWeight: 700,
                }}
              >
                {t.state === "completed" ? "✓" : "○"}
              </span>
              <span
                style={{
                  color: t.state === "completed" ? "#6E6A86" : "#E0DEF4",
                  textDecoration:
                    t.state === "completed" ? "line-through" : "none",
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// VARIANT E3: PICO-8 Retro Black & Hot Pink Arcade
// -----------------------------------------------------------------------------
function VariantE3() {
  const [tasks, setTasks] = useState(ENGLISH_SAMPLE_TASKS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleTaskState = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, state: t.state === "completed" ? "open" : "completed" }
          : t
      )
    );
  };

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        width: "100%",
        background: "var(--pico-bg-base)",
        color: "#FFFFFF",
        fontFamily: "var(--font-pixel)",
        textAlign: "left",
      }}
    >
      {/* Left Column */}
      <div
        style={{
          width: "380px",
          background: "var(--pico-bg-base)",
          borderRight: "var(--pico-border)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "#FF77A8",
            color: "#000000",
            padding: "12px 16px",
            border: "2px solid #FFFFFF",
            boxShadow: "4px 4px 0px #00E5FF",
            borderRadius: "0px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
            👾 PICO-8 ARCADE LOG
          </h3>
          <div style={{ fontSize: "11px", color: "#000000" }}>
            Theme 3: PICO Hot Pink (#FF77A8) & Cyan (#00E5FF)
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTaskState(t.id)}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: "var(--pico-bg-surface)",
                padding: "12px 14px",
                border: "var(--pico-border)",
                boxShadow:
                  hoveredId === t.id
                    ? "1px 1px 0px #FF77A8"
                    : "var(--pico-shadow)",
                transform: hoveredId === t.id ? "translate(2px, 2px)" : "none",
                transition: "var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    background: "#00E5FF",
                    color: "#000000",
                    padding: "2px 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {t.state.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", color: "#FF77A8" }}>
                  QUEST #{t.id}
                </span>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: t.state === "completed" ? "#5F5F5F" : "#FFFFFF",
                  textDecoration:
                    t.state === "completed" ? "line-through" : "none",
                }}
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column Editor */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          background: "var(--pico-bg-surface)",
        }}
      >
        <div
          style={{
            background: "#0A0A0A",
            border: "var(--pico-border)",
            boxShadow: "var(--pico-shadow)",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span
              style={{ fontSize: "11px", color: "#00E5FF", fontWeight: 700 }}
            >
              8-BIT MEMORY SLOT
            </span>
            <h2 style={{ margin: 0, color: "#FFFFFF", fontSize: "20px" }}>
              📄 project-roadmap.md
            </h2>
          </div>
          <button
            style={{
              fontFamily: "var(--font-pixel)",
              background: "#FF77A8",
              color: "#000000",
              border: "2px solid #00E5FF",
              boxShadow: "2px 2px 0px #FF77A8",
              padding: "8px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + NEW QUEST
          </button>
        </div>

        <div
          style={{
            background: "#000000",
            padding: "24px",
            border: "var(--pico-border)",
            boxShadow: "var(--pico-shadow)",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
          }}
        >
          <div
            style={{
              color: "#FF77A8",
              marginBottom: "16px",
              fontFamily: "var(--font-pixel)",
              fontSize: "16px",
            }}
          >
            # PICO-8 CHECKLIST
          </div>
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTaskState(t.id)}
              style={{
                display: "flex",
                gap: "12px",
                padding: "8px 12px",
                border: "1px solid #FF77A8",
                background: t.state === "completed" ? "#1A1A1A" : "#111111",
                marginBottom: "8px",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#00E5FF" }}>
                [{t.state === "completed" ? "★" : " "}]
              </span>
              <span
                style={{
                  color: t.state === "completed" ? "#666666" : "#FFFFFF",
                  textDecoration:
                    t.state === "completed" ? "line-through" : "none",
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// FLOATING PROTOTYPE SWITCHER
// -----------------------------------------------------------------------------
export default function Prototype() {
  const VARIANTS = [
    { key: "E1", name: "Option 1 — Cyberpunk Neon Pink & Obsidian Black" },
    { key: "E2", name: "Option 2 — Rosé Pine Moon Soho Charcoal & Pink" },
    { key: "E3", name: "Option 3 — PICO-8 Retro Black & Hot Pink Arcade" },
    {
      key: "D",
      name: "Variant D — Obsidian Slate Design System (Styled Dual Column)",
    },
    { key: "C", name: "Variant C — Dual Column (Unstyled)" },
    { key: "A", name: "Variant A — Notepad++ Classic Tabs & Sidebar" },
    { key: "B", name: "Variant B — Zen Mode (Single Document + Cmd Palette)" },
  ];

  const getInitialVariant = () => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("variant");
    return VARIANTS.find((item) => item.key === v) ? v! : "E1";
  };

  const [currentVariantKey, setCurrentVariantKey] = useState(getInitialVariant);

  const updateVariant = (key: string) => {
    setCurrentVariantKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", key);
    window.history.replaceState({}, "", url.toString());
  };

  const cycleNext = () => {
    const idx = VARIANTS.findIndex((v) => v.key === currentVariantKey);
    const nextIdx = (idx + 1) % VARIANTS.length;
    updateVariant(VARIANTS[nextIdx].key);
  };

  const cyclePrev = () => {
    const idx = VARIANTS.findIndex((v) => v.key === currentVariantKey);
    const prevIdx = (idx - 1 + VARIANTS.length) % VARIANTS.length;
    updateVariant(VARIANTS[prevIdx].key);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "ArrowLeft") cyclePrev();
      if (e.key === "ArrowRight") cycleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentVariantKey]);

  const currentObj = VARIANTS.find((v) => v.key === currentVariantKey)!;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {currentVariantKey === "E1" && <VariantE1 />}
      {currentVariantKey === "E2" && <VariantE2 />}
      {currentVariantKey === "E3" && <VariantE3 />}
      {currentVariantKey === "D" && <VariantD />}
      {currentVariantKey === "C" && <VariantC />}
      {currentVariantKey === "A" && <VariantA />}
      {currentVariantKey === "B" && <VariantB />}

      {/* Floating Bottom Switcher */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#FFFFFF",
          color: "#18181B",
          padding: "8px 16px",
          borderRadius: "4px",
          boxShadow: "4px 4px 0px #18181B",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "var(--font-pixel)",
          zIndex: 9999,
          border: "2px solid #18181B",
        }}
      >
        <button
          onClick={cyclePrev}
          style={{
            fontFamily: "var(--font-pixel)",
            background: "#6366F1",
            border: "2px solid #18181B",
            color: "#FFFFFF",
            padding: "4px 10px",
            borderRadius: "2px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ◀
        </button>

        <span>PROTOTYPE: {currentObj.name}</span>

        <button
          onClick={cycleNext}
          style={{
            fontFamily: "var(--font-pixel)",
            background: "#6366F1",
            border: "2px solid #18181B",
            color: "#FFFFFF",
            padding: "4px 10px",
            borderRadius: "2px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ▶
        </button>

        <span style={{ fontSize: "11px", color: "#71717A", marginLeft: "8px" }}>
          (Use ← → keys)
        </span>
      </div>
    </div>
  );
}
