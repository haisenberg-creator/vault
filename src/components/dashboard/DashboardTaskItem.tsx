import React from "react";
import { TaskItemWithMetadata, TaskState } from "../../types/dashboard";

export interface DashboardTaskItemProps {
  task: TaskItemWithMetadata;
  onToggleState: (task: TaskItemWithMetadata) => void;
  onSelectFile?: (filePath: string) => void;
}

export const DashboardTaskItem: React.FC<DashboardTaskItemProps> = ({
  task,
  onToggleState,
  onSelectFile,
}) => {
  const isCompleted = task.state === "completed";

  const getBadgeStyle = (state: TaskState) => {
    switch (state) {
      case "completed":
        return {
          bg: "rgba(110, 106, 134, 0.2)",
          color: "var(--rose-muted)",
          border: "1px solid var(--rose-muted)",
          icon: "✓",
          label: "[x] Completed",
        };
      case "in_progress":
        return {
          bg: "rgba(246, 193, 119, 0.15)",
          color: "var(--rose-gold)",
          border: "1px solid var(--rose-gold)",
          icon: "⋯",
          label: "[-] In Progress",
        };
      case "blocked":
        return {
          bg: "rgba(235, 111, 146, 0.15)",
          color: "var(--rose-pink)",
          border: "1px solid var(--rose-pink)",
          icon: "⊘",
          label: "[>] Blocked",
        };
      case "open":
      default:
        return {
          bg: "rgba(156, 207, 216, 0.15)",
          color: "var(--rose-foam)",
          border: "1px solid var(--rose-foam)",
          icon: "○",
          label: "[ ] Open",
        };
    }
  };

  const badge = getBadgeStyle(task.state);

  return (
    <div
      data-testid={`task-item-${task.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--rose-bg-overlay)",
        border: "1px solid rgba(110, 106, 134, 0.25)",
        transition: "var(--transition-fast)",
      }}
      className="tactile-card"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Toggle Checkbox Button */}
        <button
          type="button"
          data-testid={`toggle-task-${task.id}`}
          onClick={() => onToggleState(task)}
          title={`Click to toggle task state (Current: ${badge.label})`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            background: badge.bg,
            color: badge.color,
            border: badge.border,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
            flexShrink: 0,
            outline: "none",
          }}
          className="tactile-btn badge-pop"
        >
          {badge.icon}
        </button>

        {/* Task Title */}
        <span
          style={{
            fontSize: "13.5px",
            fontWeight: 500,
            wordBreak: "break-word",
          }}
          className={isCompleted ? "task-completed-text" : "task-title-text"}
        >
          {task.title}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {/* Tag Badges */}
        {task.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "11px",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: "rgba(196, 167, 231, 0.15)",
              color: "var(--rose-iris)",
              border: "1px solid rgba(196, 167, 231, 0.3)",
              fontWeight: 500,
            }}
          >
            {tag}
          </span>
        ))}

        {/* Clickable Source Note Link */}
        {onSelectFile && (
          <button
            type="button"
            data-testid={`source-file-link-${task.id}`}
            onClick={() => onSelectFile(task.sourceFile)}
            title={`Open source file: ${task.sourceFile}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(49, 116, 143, 0.2)",
              color: "var(--rose-foam)",
              border: "1px solid rgba(156, 207, 216, 0.3)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
            className="tactile-btn"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {task.noteName || task.sourceFile}
          </button>
        )}
      </div>
    </div>
  );
};
