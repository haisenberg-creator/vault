import React, { useState } from "react";
import {
  DashboardFilter,
  DashboardSectionResult,
  TaskItemWithMetadata,
} from "../../types/dashboard";
import { DashboardTaskItem } from "./DashboardTaskItem";

export interface DashboardSectionWidgetProps {
  section: DashboardSectionResult;
  filterConfig?: DashboardFilter;
  onToggleTaskState: (task: TaskItemWithMetadata) => void;
  onSelectFile?: (filePath: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const DashboardSectionWidget: React.FC<DashboardSectionWidgetProps> = ({
  section,
  filterConfig,
  onToggleTaskState,
  onSelectFile,
  onSelectTag,
}) => {
  // Track collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const totalTasks = section.groups.reduce((acc, g) => acc + g.tasks.length, 0);

  return (
    <div
      data-testid={`section-widget-${section.sectionId}`}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--rose-bg-surface)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--rose-border-color)",
        padding: "16px",
        gap: "14px",
        boxShadow: "var(--rose-shadow)",
      }}
      className="tactile-card"
    >
      {/* Section Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "10px",
          borderBottom: "1px solid rgba(110, 106, 134, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--rose-rose)",
              fontFamily: "var(--font-ui)",
            }}
          >
            {section.sectionTitle}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: "rgba(235, 111, 146, 0.2)",
              color: "var(--rose-pink)",
              border: "1px solid rgba(235, 111, 146, 0.4)",
            }}
            className="badge-pop"
            data-testid={`section-count-${section.sectionId}`}
          >
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Filter Badges Summary */}
        {filterConfig && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {filterConfig.folder && (
              <span
                style={{
                  fontSize: "10.5px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(246, 193, 119, 0.15)",
                  color: "var(--rose-gold)",
                }}
              >
                📁 {filterConfig.folder}
              </span>
            )}
            {filterConfig.state && filterConfig.state.length > 0 && (
              <span
                style={{
                  fontSize: "10.5px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(156, 207, 216, 0.15)",
                  color: "var(--rose-foam)",
                }}
              >
                ⚙ {filterConfig.state.join(", ")}
              </span>
            )}
            {filterConfig.tags && filterConfig.tags.length > 0 && (
              <span
                style={{
                  fontSize: "10.5px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(196, 167, 231, 0.15)",
                  color: "var(--rose-iris)",
                }}
              >
                🏷 {filterConfig.tags.join(", ")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Task Groups / Empty State */}
      {totalTasks === 0 ? (
        <div
          data-testid={`empty-section-${section.sectionId}`}
          style={{
            padding: "24px",
            textAlign: "center",
            color: "var(--rose-muted)",
            fontSize: "13px",
            fontStyle: "italic",
            backgroundColor: "rgba(38, 35, 58, 0.4)",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed rgba(110, 106, 134, 0.3)",
          }}
        >
          No tasks matching query filters
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {section.groups.map((group) => {
            const isGrouped = group.groupKey !== "all";
            const isCollapsed = collapsedGroups[group.id];

            return (
              <div
                key={group.id}
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {/* Group Header (if grouped) */}
                {isGrouped && (
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 8px",
                      backgroundColor: "rgba(38, 35, 58, 0.6)",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      color: "var(--rose-gold)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    className="tactile-btn"
                  >
                    <span>
                      {isCollapsed ? "▶" : "▼"} {group.title}
                    </span>
                    <span
                      style={{ fontSize: "11px", color: "var(--rose-subtle)" }}
                    >
                      ({group.tasks.length})
                    </span>
                  </button>
                )}

                {/* Task Items */}
                {!isCollapsed && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {group.tasks.map((task) => (
                      <DashboardTaskItem
                        key={task.id}
                        task={task}
                        onToggleState={onToggleTaskState}
                        onSelectFile={onSelectFile}
                        onSelectTag={onSelectTag}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
