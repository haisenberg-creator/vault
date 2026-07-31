import React, { useState } from "react";

export type TaskState = "open" | "in_progress" | "blocked" | "completed";

interface TaskItem {
  id: string;
  title: string;
  sourceFile: string;
  state: TaskState;
}

const DUMMY_TASKS: TaskItem[] = [
  {
    id: "1",
    title: "Set up Dual Column layout shell",
    sourceFile: "01-core-layout.md",
    state: "completed",
  },
  {
    id: "2",
    title: "Integrate Tauri file system commands",
    sourceFile: "02-markdown-integration.md",
    state: "in_progress",
  },
  {
    id: "3",
    title: "Implement Lexical Markdown transformer",
    sourceFile: "03-lexical-foundation.md",
    state: "open",
  },
  {
    id: "4",
    title: "Create custom task node portal renderer",
    sourceFile: "04-custom-checklist-nodes.md",
    state: "blocked",
  },
  {
    id: "5",
    title: "Verify WCAG AA color contrast",
    sourceFile: "07-ui-polish.md",
    state: "open",
  },
];

export const TaskDashboardSidebar: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<TaskState | "all">("all");

  const filteredTasks =
    activeFilter === "all"
      ? DUMMY_TASKS
      : DUMMY_TASKS.filter((t) => t.state === activeFilter);

  const getBadgeStyle = (state: TaskState) => {
    switch (state) {
      case "completed":
        return {
          bg: "rgba(156, 207, 216, 0.15)",
          color: "var(--rose-foam)",
          border: "rgba(156, 207, 216, 0.3)",
          label: "Completed",
        };
      case "in_progress":
        return {
          bg: "rgba(246, 193, 119, 0.15)",
          color: "var(--rose-gold)",
          border: "rgba(246, 193, 119, 0.3)",
          label: "In Progress",
        };
      case "blocked":
        return {
          bg: "rgba(235, 111, 146, 0.15)",
          color: "var(--rose-pink)",
          border: "rgba(235, 111, 146, 0.3)",
          label: "Blocked",
        };
      case "open":
      default:
        return {
          bg: "rgba(196, 167, 231, 0.15)",
          color: "var(--rose-iris)",
          border: "rgba(196, 167, 231, 0.3)",
          label: "Open",
        };
    }
  };

  const counts = {
    all: DUMMY_TASKS.length,
    open: DUMMY_TASKS.filter((t) => t.state === "open").length,
    in_progress: DUMMY_TASKS.filter((t) => t.state === "in_progress").length,
    blocked: DUMMY_TASKS.filter((t) => t.state === "blocked").length,
    completed: DUMMY_TASKS.filter((t) => t.state === "completed").length,
  };

  return (
    <aside
      style={{
        width: "300px",
        minWidth: "260px",
        maxWidth: "360px",
        height: "100%",
        backgroundColor: "var(--rose-bg-surface)",
        borderRight: "1px solid rgba(110, 106, 134, 0.25)",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
      }}
    >
      {/* Header Bar */}
      <div
        className="rose-glow-animated"
        style={{
          padding: "16px",
          borderBottom: "1px solid rgba(110, 106, 134, 0.25)",
          backgroundColor: "var(--rose-bg-overlay)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>📋</span>
          <h2
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "15px",
              letterSpacing: "0.5px",
              color: "var(--rose-pink)",
              margin: 0,
            }}
          >
            TASK DASHBOARD
          </h2>
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "var(--rose-subtle)",
            marginTop: "4px",
          }}
        >
          Aggregated workspace checklists
        </p>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "10px 12px",
          borderBottom: "1px solid rgba(110, 106, 134, 0.15)",
          flexWrap: "wrap",
        }}
      >
        {(["all", "open", "in_progress", "blocked", "completed"] as const).map(
          (filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: isActive
                    ? "var(--rose-pink)"
                    : "rgba(38, 35, 58, 0.6)",
                  color: isActive ? "#191724" : "var(--rose-subtle)",
                  transition: "var(--transition-fast)",
                  textTransform: "capitalize",
                }}
              >
                {filter.replace("_", " ")} ({counts[filter]})
              </button>
            );
          }
        )}
      </div>

      {/* Task List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {filteredTasks.map((task) => {
          const badge = getBadgeStyle(task.state);
          return (
            <div
              key={task.id}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--rose-bg-overlay)",
                border: "1px solid rgba(110, 106, 134, 0.15)",
                marginBottom: "8px",
                transition: "var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--rose-text)",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {task.title}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--rose-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  📄 {task.sourceFile}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                  }}
                >
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
