import React, { useState } from "react";
import { TaskState } from "../sidebar/TaskDashboardSidebar";

export interface NoteActionBarProps {
  onAddTask?: () => void;
  onChangeTaskStatus?: (status: TaskState) => void;
  onApplyPrefix?: (prefix: string) => void;
  onInsertPriorityTemplate?: () => void;
}

const MARKER_STYLES = [
  { label: "- Dash Bullet", prefix: "- " },
  { label: "+ Plus Bullet", prefix: "+ " },
  { label: "* Star Bullet", prefix: "* " },
  { label: "• Solid Dot", prefix: "• " },
  { label: "◦ Open Circle", prefix: "◦ " },
  { label: "▪ Square Bullet", prefix: "▪ " },
  { label: "→ Arrow Pointer", prefix: "→ " },
  { label: "★ Star Symbol", prefix: "★ " },
  { label: "1. Numbered List", prefix: "1. " },
];

export const NoteActionBar: React.FC<NoteActionBarProps> = ({
  onAddTask,
  onChangeTaskStatus,
  onApplyPrefix,
  onInsertPriorityTemplate,
}) => {
  const [showMarkerDropdown, setShowMarkerDropdown] = useState(false);

  return (
    <div
      data-testid="note-action-bar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        backgroundColor: "var(--rose-bg-overlay)",
        borderBottom: "1px solid rgba(110, 106, 134, 0.25)",
        flexWrap: "wrap",
        userSelect: "none",
      }}
    >
      {/* Quick Add Task Button */}
      <button
        data-testid="note-action-add-task"
        onClick={onAddTask}
        className="tactile-btn"
        style={{
          padding: "4px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--rose-pink)",
          backgroundColor: "rgba(235, 111, 146, 0.15)",
          color: "var(--rose-pink)",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>+</span>
        <span>New Task</span>
      </button>

      {/* Priority Template Button */}
      <button
        data-testid="note-action-priority-template"
        onClick={onInsertPriorityTemplate}
        className="tactile-btn"
        style={{
          padding: "4px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--rose-gold)",
          backgroundColor: "rgba(246, 193, 119, 0.15)",
          color: "var(--rose-gold)",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>⚡</span>
        <span>Priority Template</span>
      </button>

      <div
        style={{
          height: "16px",
          width: "1px",
          backgroundColor: "rgba(110, 106, 134, 0.3)",
        }}
      />

      {/* Task Status Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            fontSize: "10px",
            color: "var(--rose-subtle)",
            fontWeight: 600,
          }}
        >
          STATUS:
        </span>
        {(["open", "in_progress", "blocked", "completed"] as const).map(
          (st) => (
            <button
              key={st}
              data-testid={`note-status-${st}`}
              onClick={() => onChangeTaskStatus?.(st)}
              className="tactile-btn"
              style={{
                padding: "3px 7px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(110, 106, 134, 0.25)",
                backgroundColor: "var(--rose-bg-surface)",
                color:
                  st === "open"
                    ? "var(--rose-iris)"
                    : st === "in_progress"
                      ? "var(--rose-gold)"
                      : st === "blocked"
                        ? "var(--rose-love)"
                        : "var(--rose-foam)",
                fontSize: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {st === "open"
                ? "Open"
                : st === "in_progress"
                  ? "In Progress"
                  : st === "blocked"
                    ? "Blocked"
                    : "Done"}
            </button>
          )
        )}
      </div>

      <div
        style={{
          height: "16px",
          width: "1px",
          backgroundColor: "rgba(110, 106, 134, 0.3)",
        }}
      />

      {/* Marker / List Style Picker Dropdown */}
      <div style={{ position: "relative" }}>
        <button
          data-testid="note-action-marker-picker"
          onClick={() => setShowMarkerDropdown((prev) => !prev)}
          className="tactile-btn"
          style={{
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(110, 106, 134, 0.3)",
            backgroundColor: "var(--rose-bg-surface)",
            color: "var(--rose-text)",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>Style / Marker ▾</span>
        </button>

        {showMarkerDropdown && (
          <div
            data-testid="marker-dropdown-menu"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              width: "180px",
              maxHeight: "240px",
              overflowY: "auto",
              backgroundColor: "var(--rose-bg-surface)",
              border: "1px solid var(--rose-border-color)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--rose-shadow)",
              zIndex: 100,
              padding: "4px",
            }}
          >
            {MARKER_STYLES.map((style) => (
              <button
                key={style.prefix}
                data-testid={`marker-option-${style.prefix.trim()}`}
                onClick={() => {
                  onApplyPrefix?.(style.prefix);
                  setShowMarkerDropdown(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--rose-text)",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--rose-bg-overlay)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
