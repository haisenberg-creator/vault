import React, { useState } from "react";

export type TaskState = "open" | "in_progress" | "blocked" | "completed";

export interface TaskItem {
  id: string;
  nodeKey?: string;
  title: string;
  sourceFile: string;
  state: TaskState;
}

export interface TaskDashboardSidebarProps {
  tasks?: TaskItem[];
  activeFilter?: TaskState | "all";
  onFilterChange?: (filter: TaskState | "all") => void;
  onToggleTask?: (taskId: string) => void;
}

export const TaskDashboardSidebar: React.FC<TaskDashboardSidebarProps> = ({
  tasks = [],
  activeFilter: propsFilter,
  onFilterChange,
  onToggleTask,
}) => {
  const [internalFilter, setInternalFilter] = useState<TaskState | "all">(
    "all"
  );

  const activeFilter = propsFilter ?? internalFilter;

  const handleFilterClick = (filter: TaskState | "all") => {
    if (onFilterChange) {
      onFilterChange(filter);
    } else {
      setInternalFilter(filter);
    }
  };

  const filteredTasks =
    activeFilter === "all"
      ? tasks
      : tasks.filter((t) => t.state === activeFilter);

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
    all: tasks.length,
    open: tasks.filter((t) => t.state === "open").length,
    in_progress: tasks.filter((t) => t.state === "in_progress").length,
    blocked: tasks.filter((t) => t.state === "blocked").length,
    completed: tasks.filter((t) => t.state === "completed").length,
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
                data-testid={`filter-btn-${filter}`}
                onClick={() => handleFilterClick(filter)}
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
        {filteredTasks.length === 0 ? (
          <div
            data-testid="empty-tasks-message"
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--rose-subtle)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            No tasks found
          </div>
        ) : (
          filteredTasks.map((task) => {
            const badge = getBadgeStyle(task.state);
            return (
              <div
                key={task.id}
                data-testid={`sidebar-task-item-${task.id}`}
                data-task-state={task.state}
                onClick={() => onToggleTask?.(task.id)}
                role="button"
                tabIndex={0}
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
          })
        )}
      </div>
    </aside>
  );
};
