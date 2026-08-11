import React, { useState, useEffect, useCallback } from "react";
import { FileTreeNode } from "../../types/workspaceTree";
import { PinnedDashboards } from "./PinnedDashboards";
import { SidebarTree } from "./SidebarTree";
import { FileOperationModal, OperationMode } from "./FileOperationModal";
import {
  readWorkspaceTree,
  createFile,
  createFolder,
  renamePath,
  deletePath,
  movePath,
  subscribeToWorkspaceChanges,
} from "../../services/fileService";
import {
  getThemeMode,
  toggleThemeMode,
  applyThemeMode,
  ThemeMode,
} from "../../services/themeService";

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
  activeFilePath?: string;
  onSelectFile?: (filePath: string) => void;
  workspaceDir?: string;
  initialTab?: "files" | "tasks";
  onMoveTaskToNote?: (
    taskTitle: string,
    sourceFile: string,
    targetNotePath: string
  ) => void;
}

export const TaskDashboardSidebar: React.FC<TaskDashboardSidebarProps> = ({
  tasks = [],
  activeFilter: propsFilter,
  onFilterChange,
  onToggleTask,
  activeFilePath,
  onSelectFile,
  workspaceDir = "workspace",
  initialTab = "tasks",
  onMoveTaskToNote,
}) => {
  const [activeTab, setActiveTab] = useState<"files" | "tasks">(initialTab);
  const [treeNodes, setTreeNodes] = useState<FileTreeNode[]>([]);
  const [internalFilter, setInternalFilter] = useState<TaskState | "all">(
    "all"
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    getThemeMode()
  );

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  const handleToggleThemeMode = () => {
    const next = toggleThemeMode();
    setThemeModeState(next);
  };

  // Modal State for file operations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<OperationMode | null>(null);
  const [modalTargetPath, setModalTargetPath] = useState<string | undefined>();
  const [modalInitialValue, setModalInitialValue] = useState("");
  const [targetNodeToRename, setTargetNodeToRename] =
    useState<FileTreeNode | null>(null);

  const activeFilter = propsFilter ?? internalFilter;

  // Load directory tree
  const loadTree = useCallback(async () => {
    try {
      const nodes = await readWorkspaceTree(workspaceDir);
      setTreeNodes(nodes);
    } catch (err) {
      console.warn("Failed to load workspace tree in sidebar:", err);
    }
  }, [workspaceDir]);

  useEffect(() => {
    loadTree();
    const unsubscribe = subscribeToWorkspaceChanges(() => {
      loadTree();
    });
    return () => {
      unsubscribe();
    };
  }, [loadTree]);

  // Recursively gather all dashboard files
  const collectDashboards = (nodes: FileTreeNode[]): FileTreeNode[] => {
    const dashboards: FileTreeNode[] = [];
    const traverse = (items: FileTreeNode[]) => {
      for (const item of items) {
        if (
          item.kind === "dashboard" ||
          item.isDashboard ||
          item.name.endsWith(".dashboard.md")
        ) {
          dashboards.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    };
    traverse(nodes);
    return dashboards;
  };

  const pinnedDashboards = collectDashboards(treeNodes);

  // CRUD Handler Triggers
  const handleOpenCreateModal = (
    mode: OperationMode,
    targetFolderPath?: string
  ) => {
    setModalMode(mode);
    setModalTargetPath(targetFolderPath);
    setModalInitialValue("");
    setModalOpen(true);
  };

  const handleOpenRenameModal = (node: FileTreeNode) => {
    setTargetNodeToRename(node);
    setModalMode("rename");
    setModalTargetPath(node.path);
    setModalInitialValue(node.name);
    setModalOpen(true);
  };

  const handleDeleteItem = async (node: FileTreeNode) => {
    if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
      try {
        await deletePath(node.path);
        loadTree();
      } catch (err) {
        console.error("Failed to delete item:", err);
      }
    }
  };

  const handleMoveItem = async (
    sourcePath: string,
    targetFolderPath: string
  ) => {
    try {
      await movePath(sourcePath, targetFolderPath);
      loadTree();
    } catch (err) {
      console.error("Failed to move path:", err);
    }
  };

  const handleModalSubmit = async (
    name: string,
    mode: OperationMode,
    targetPath?: string
  ) => {
    try {
      if (mode === "create-note") {
        const fileName = name.endsWith(".md") ? name : `${name}.md`;
        const fullPath = targetPath ? `${targetPath}/${fileName}` : fileName;
        await createFile(fullPath, `# ${name.replace(/\.md$/, "")}\n\n`);
      } else if (mode === "create-folder") {
        const fullPath = targetPath ? `${targetPath}/${name}` : name;
        await createFolder(fullPath);
      } else if (mode === "create-dashboard") {
        const fileName = name.endsWith(".dashboard.md")
          ? name
          : name.endsWith(".md")
            ? name.replace(/\.md$/, ".dashboard.md")
            : `${name}.dashboard.md`;
        const fullPath = targetPath ? `${targetPath}/${fileName}` : fileName;
        const initialContent = `---
type: dashboard
title: ${name.replace(/\.(dashboard\.md|md)$/i, "")}
sections:
  - id: sec-1
    title: All Tasks
    filter:
      state: [open, in_progress, blocked]
---
`;
        await createFile(fullPath, initialContent);
      } else if (mode === "rename" && targetNodeToRename) {
        const oldPath = targetNodeToRename.path;
        const pathParts = oldPath.split("/");
        pathParts.pop();
        const parentPath = pathParts.join("/");
        const newPath = parentPath ? `${parentPath}/${name}` : name;
        await renamePath(oldPath, newPath);
      }
      loadTree();
    } catch (err) {
      console.error("File operation error:", err);
    }
  };

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
      data-testid="sidebar-container"
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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

          <button
            data-testid="theme-mode-toggle-btn"
            onClick={handleToggleThemeMode}
            className="tactile-btn"
            style={{
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              border:
                themeMode === "arcade"
                  ? "1px solid var(--rose-pink)"
                  : "1px solid rgba(110, 106, 134, 0.3)",
              backgroundColor:
                themeMode === "arcade"
                  ? "rgba(235, 111, 146, 0.2)"
                  : "rgba(38, 35, 58, 0.6)",
              color:
                themeMode === "arcade"
                  ? "var(--rose-pink)"
                  : "var(--rose-text)",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title={
              themeMode === "arcade"
                ? "Switch to Working Mode"
                : "Switch to Arcade Mode"
            }
          >
            {themeMode === "arcade" ? (
              <>
                <span
                  style={{
                    fontSize: "12px",
                    filter: "drop-shadow(0 0 4px var(--rose-pink))",
                  }}
                >
                  📖✨
                </span>
                <span>ARCADE</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: "12px" }}>📖</span>
                <span>WORKING</span>
              </>
            )}
          </button>
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

      {/* Pinned Dashboards Bar */}
      <PinnedDashboards
        dashboards={pinnedDashboards}
        activeDashboardPath={activeFilePath}
        onSelectDashboard={(path) => onSelectFile?.(path)}
      />

      {/* Navigation View Mode Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(110, 106, 134, 0.25)",
          backgroundColor: "rgba(25, 23, 36, 0.4)",
        }}
      >
        <button
          data-testid="tab-files"
          onClick={() => setActiveTab("files")}
          className="tactile-btn"
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderBottom:
              activeTab === "files" ? "2px solid var(--rose-pink)" : "none",
            backgroundColor:
              activeTab === "files" ? "var(--rose-bg-overlay)" : "transparent",
            color:
              activeTab === "files" ? "var(--rose-pink)" : "var(--rose-subtle)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Files & Folders
        </button>
        <button
          data-testid="tab-tasks"
          onClick={() => setActiveTab("tasks")}
          className="tactile-btn"
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderBottom:
              activeTab === "tasks" ? "2px solid var(--rose-pink)" : "none",
            backgroundColor:
              activeTab === "tasks" ? "var(--rose-bg-overlay)" : "transparent",
            color:
              activeTab === "tasks" ? "var(--rose-pink)" : "var(--rose-subtle)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tasks ({tasks.length})
        </button>
      </div>

      {/* Tab Content: Files & Folders */}
      {activeTab === "files" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* File Action Toolbar */}
          <div
            style={{
              padding: "8px 10px",
              display: "flex",
              gap: "6px",
              borderBottom: "1px solid rgba(110, 106, 134, 0.15)",
              backgroundColor: "rgba(38, 35, 58, 0.3)",
            }}
          >
            <button
              data-testid="sidebar-action-new-note"
              onClick={() => handleOpenCreateModal("create-note")}
              className="tactile-btn"
              style={{
                flex: 1,
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 6px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(110, 106, 134, 0.25)",
                backgroundColor: "var(--rose-bg-overlay)",
                color: "var(--rose-text)",
                cursor: "pointer",
              }}
            >
              + Note
            </button>
            <button
              data-testid="sidebar-action-new-folder"
              onClick={() => handleOpenCreateModal("create-folder")}
              className="tactile-btn"
              style={{
                flex: 1,
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 6px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(110, 106, 134, 0.25)",
                backgroundColor: "var(--rose-bg-overlay)",
                color: "var(--rose-gold)",
                cursor: "pointer",
              }}
            >
              + Folder
            </button>
            <button
              data-testid="sidebar-action-new-dashboard"
              onClick={() => handleOpenCreateModal("create-dashboard")}
              className="tactile-btn"
              style={{
                flex: 1,
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 6px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(235, 111, 146, 0.3)",
                backgroundColor: "rgba(235, 111, 146, 0.15)",
                color: "var(--rose-pink)",
                cursor: "pointer",
              }}
            >
              + Dashboard
            </button>
          </div>

          {/* Tree Component */}
          <SidebarTree
            nodes={treeNodes}
            activeFilePath={activeFilePath}
            onSelectFile={(node) => onSelectFile?.(node.path)}
            onCreateNote={(folder) =>
              handleOpenCreateModal("create-note", folder)
            }
            onCreateFolder={(folder) =>
              handleOpenCreateModal("create-folder", folder)
            }
            onCreateDashboard={(folder) =>
              handleOpenCreateModal("create-dashboard", folder)
            }
            onRename={handleOpenRenameModal}
            onDelete={handleDeleteItem}
            onMovePath={handleMoveItem}
            onMoveTaskToNote={onMoveTaskToNote}
          />
        </div>
      )}

      {/* Tab Content: Tasks View */}
      {activeTab === "tasks" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
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
            {(
              ["all", "open", "in_progress", "blocked", "completed"] as const
            ).map((filter) => {
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
            })}
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
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({
                          taskTitle: task.title,
                          sourceFile: task.sourceFile,
                        })
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
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
        </div>
      )}

      {/* File Operation Input Modal */}
      <FileOperationModal
        isOpen={modalOpen}
        mode={modalMode}
        targetPath={modalTargetPath}
        initialValue={modalInitialValue}
        onSubmit={handleModalSubmit}
        onClose={() => setModalOpen(false)}
      />
    </aside>
  );
};
