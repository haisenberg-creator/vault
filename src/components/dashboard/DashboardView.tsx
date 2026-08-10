import React, { useState } from "react";
import {
  parseDashboardSchema,
  executeDashboardQuery,
} from "../../services/dashboardService";
import {
  writeMarkdownFile,
  readMarkdownFile,
  normalizePath,
  WorkspaceFile,
} from "../../services/fileService";
import { toggleTaskInMarkdown } from "../../services/workspaceService";
import { TaskItemWithMetadata } from "../../types/dashboard";
import { getNextTaskState } from "../editor/ChecklistNode";
import { EditorPane } from "../editor/EditorPane";
import { DashboardSectionWidget } from "./DashboardSectionWidget";

export interface DashboardViewProps {
  filePath: string;
  workspaceFiles: WorkspaceFile[];
  onSelectFile?: (filePath: string) => void;
  onRefreshWorkspace?: () => void;
  onTasksChange?: (tasks: any[]) => void;
  onRegisterToggleTask?: (toggleFn: (nodeKey: string) => void) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  filePath,
  workspaceFiles,
  onSelectFile,
  onRefreshWorkspace,
  onTasksChange,
  onRegisterToggleTask,
}) => {
  const [viewMode, setViewMode] = useState<"interactive" | "raw">(
    "interactive"
  );

  // Find target dashboard file content from workspaceFiles
  const targetFile = workspaceFiles.find((f) => {
    const normF = normalizePath(f.path);
    const normP = normalizePath(filePath);
    return normF === normP || f.name === filePath || f.path === filePath;
  });

  const activeContent = targetFile ? targetFile.content : "";

  // Parse schema and execute query
  const schema = parseDashboardSchema(activeContent, filePath);
  const queryResult = executeDashboardQuery(workspaceFiles, schema);

  const totalMatchingTasks = queryResult.sections.reduce(
    (total, sec) =>
      total + sec.groups.reduce((gTotal, g) => gTotal + g.tasks.length, 0),
    0
  );

  const handleToggleTaskState = async (task: TaskItemWithMetadata) => {
    try {
      const normSourcePath = normalizePath(task.sourceFile);
      const sourceFileObj = workspaceFiles.find(
        (f) =>
          normalizePath(f.path) === normSourcePath || f.name === task.sourceFile
      );

      const currentContent = sourceFileObj
        ? sourceFileObj.content
        : await readMarkdownFile(task.sourceFile);

      const nextState = getNextTaskState(task.state);
      const updatedContent = toggleTaskInMarkdown(
        currentContent,
        task.title,
        nextState
      );

      await writeMarkdownFile(task.sourceFile, updatedContent);

      if (onRefreshWorkspace) {
        onRefreshWorkspace();
      }
    } catch (err) {
      console.error("Failed to mutate task state from dashboard:", err);
    }
  };

  return (
    <div
      data-testid="dashboard-view-container"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        width: "100%",
        backgroundColor: "var(--rose-bg-base)",
        overflow: "hidden",
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          backgroundColor: "var(--rose-bg-surface)",
          borderBottom: "1px solid var(--rose-border-color)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Dashboard Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(235, 111, 146, 0.2)",
              color: "var(--rose-pink)",
              border: "1px solid rgba(235, 111, 146, 0.4)",
            }}
            className="rose-glow-animated"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>

          <div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--rose-text)",
                margin: 0,
                fontFamily: "var(--font-ui)",
                lineHeight: 1.2,
              }}
              data-testid="dashboard-title"
            >
              {queryResult.dashboardTitle}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "var(--rose-subtle)",
                marginTop: "2px",
              }}
            >
              <span>{queryResult.sections.length} Sections</span>
              <span>•</span>
              <span>{totalMatchingTasks} Total Tasks</span>
            </div>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Refresh Button */}
          {onRefreshWorkspace && (
            <button
              type="button"
              data-testid="refresh-dashboard-btn"
              onClick={onRefreshWorkspace}
              title="Refresh task queries"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--rose-bg-overlay)",
                color: "var(--rose-foam)",
                border: "1px solid rgba(156, 207, 216, 0.3)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              className="tactile-btn"
            >
              🔄 Refresh
            </button>
          )}

          {/* Mode Switcher Buttons */}
          <div
            style={{
              display: "inline-flex",
              padding: "3px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--rose-bg-overlay)",
              border: "1px solid rgba(110, 106, 134, 0.3)",
            }}
          >
            <button
              type="button"
              data-testid="mode-interactive-btn"
              onClick={() => setViewMode("interactive")}
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor:
                  viewMode === "interactive"
                    ? "var(--rose-pink)"
                    : "transparent",
                color:
                  viewMode === "interactive" ? "#ffffff" : "var(--rose-subtle)",
                transition: "var(--transition-fast)",
              }}
              className="tactile-btn"
            >
              Interactive View
            </button>
            <button
              type="button"
              data-testid="mode-raw-btn"
              onClick={() => setViewMode("raw")}
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor:
                  viewMode === "raw" ? "var(--rose-pink)" : "transparent",
                color: viewMode === "raw" ? "#ffffff" : "var(--rose-subtle)",
                transition: "var(--transition-fast)",
              }}
              className="tactile-btn"
            >
              Raw YAML Source
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: viewMode === "interactive" ? "24px" : "0",
        }}
      >
        {viewMode === "interactive" ? (
          <div
            data-testid="interactive-widget-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {queryResult.sections.map((section, index) => {
              const secConfig = schema.sections[index];
              return (
                <DashboardSectionWidget
                  key={section.sectionId}
                  section={section}
                  filterConfig={secConfig?.filter}
                  onToggleTaskState={handleToggleTaskState}
                  onSelectFile={onSelectFile}
                />
              );
            })}
          </div>
        ) : (
          <div
            style={{ height: "100%", width: "100%" }}
            data-testid="raw-source-editor"
          >
            <EditorPane
              filename={filePath}
              onTasksChange={onTasksChange}
              onRegisterToggleTask={onRegisterToggleTask}
            />
          </div>
        )}
      </div>
    </div>
  );
};
