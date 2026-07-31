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

  const totalCount = tasks.length;
  const completedCount = counts.completed;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--rose-pink)" }}
          >
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M12 11h4" />
            <path d="M12 16h4" />
            <path d="M8 11h.01" />
            <path d="M8 16h.01" />
          </svg>
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

      {/* Live Workspace Progress Meter */}
      <div
        data-testid="workspace-progress-meter"
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(110, 106, 134, 0.15)",
          backgroundColor: "rgba(25, 23, 36, 0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            marginBottom: "6px",
          }}
        >
          <span style={{ color: "var(--rose-subtle)", fontWeight: 500 }}>
            Workspace Progress
          </span>
          <span
            style={{
              color: "var(--rose-foam)",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
            }}
          >
            {completionPercentage}%
          </span>
        </div>
        <div
          style={{
            height: "6px",
            width: "100%",
            backgroundColor: "rgba(38, 35, 58, 0.8)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            data-testid="progress-bar-fill"
            style={{
              height: "100%",
              width: `${completionPercentage}%`,
              background:
                "linear-gradient(90deg, var(--rose-pine), var(--rose-foam))",
              borderRadius: "3px",
              transition: "width 350ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 8px rgba(156, 207, 216, 0.4)",
            }}
          />
        </div>
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
                className="tactile-btn"
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
            const isCompleted = task.state === "completed";
            return (
              <div
                key={task.id}
                data-testid={`sidebar-task-item-${task.id}`}
                data-task-state={task.state}
                onClick={() => onToggleTask?.(task.id)}
                role="button"
                tabIndex={0}
                className="tactile-card"
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--rose-bg-overlay)",
                  border: "1px solid rgba(110, 106, 134, 0.15)",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
              >
                <div
                  className={
                    isCompleted ? "task-completed-text" : "task-title-text"
                  }
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
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ marginRight: "4px" }}
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {task.sourceFile}
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
