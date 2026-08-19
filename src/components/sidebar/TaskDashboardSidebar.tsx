import React, { useState, useEffect, useCallback, useRef } from "react";
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
  normalizePath,
  isSameFilePath,
  stripWorkspacePrefix,
  importFolderFiles,
} from "../../services/fileService";
import { ThemeMode } from "../../services/themeService";
import { extractTags } from "../../services/dashboardService";

export type TaskState = "open" | "in_progress" | "blocked" | "completed";

export interface TaskItem {
  id: string;
  nodeKey?: string;
  title: string;
  sourceFile: string;
  state: TaskState;
  tags?: string[];
  priority?: string;
}

export interface TaskDashboardSidebarProps {
  tasks?: TaskItem[];
  activeFileTasks?: TaskItem[];
  activeFilter?: TaskState | "all";
  activeTagFilter?: string | null;
  onFilterChange?: (filter: TaskState | "all") => void;
  onClearTagFilter?: () => void;
  onSelectTag?: (tag: string) => void;
  onToggleTask?: (taskId: string) => void;
  activeFilePath?: string;
  onSelectFile?: (filePath: string) => void;
  workspaceDir?: string;
  initialTab?: "files" | "tasks";
  onMoveTaskToNote?: (
    taskTitle: string,
    sourceFile: string,
    targetNotePath: string,
    priority?: string
  ) => void;
  onDeleteTask?: (taskId: string) => void;
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
}

export const TaskDashboardSidebar: React.FC<TaskDashboardSidebarProps> = ({
  tasks = [],
  activeFileTasks,
  activeFilter: propsFilter,
  activeTagFilter,
  onFilterChange,
  onClearTagFilter,
  onSelectTag,
  onToggleTask,
  activeFilePath,
  onSelectFile,
  workspaceDir = "workspace",
  initialTab = "files",
  onMoveTaskToNote,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<"files" | "tasks">(initialTab);
  const [treeNodes, setTreeNodes] = useState<FileTreeNode[]>([]);
  const [internalFilter, setInternalFilter] = useState<TaskState | "all">(
    "all"
  );
  const [collapsedTaskNodes, setCollapsedTaskNodes] = useState<Set<string>>(
    new Set()
  );

  // Modal State for file operations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<OperationMode | null>(null);
  const [modalTargetPath, setModalTargetPath] = useState<string | undefined>();
  const [modalInitialValue, setModalInitialValue] = useState("");
  const [targetNodeToRename, setTargetNodeToRename] =
    useState<FileTreeNode | null>(null);

  const activeFilter = propsFilter ?? internalFilter;

  // Move Task Modal State
  const [movingTask, setMovingTask] = useState<TaskItem | null>(null);
  const [selectedTargetNote, setSelectedTargetNote] = useState<string>("");

  const importFolderInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const importedPaths = await importFolderFiles(files);
      if (importedPaths.length > 0 && onSelectFile) {
        onSelectFile(importedPaths[0]);
      }
      await loadTree();
    } catch (err) {
      console.warn("Failed to import folder:", err);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const collectNotes = useCallback((nodes: FileTreeNode[]): FileTreeNode[] => {
    const result: FileTreeNode[] = [];
    nodes.forEach((n) => {
      if (n.kind === "file" && n.path.endsWith(".md")) {
        result.push(n);
      }
      if (n.children) {
        result.push(...collectNotes(n.children));
      }
    });
    return result;
  }, []);

  const availableNotes = collectNotes(treeNodes).filter(
    (n) =>
      movingTask &&
      !isSameFilePath(n.path, movingTask.sourceFile, workspaceDir) &&
      n.name !== movingTask.sourceFile
  );

  useEffect(() => {
    if (movingTask && availableNotes.length > 0) {
      setSelectedTargetNote(availableNotes[0].path);
    }
  }, [movingTask, availableNotes]);

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
    const defaultDir = workspaceDir || "workspace";
    const effectiveDir =
      targetPath && targetPath.trim() ? targetPath : defaultDir;

    try {
      if (mode === "create-note") {
        const fileName = name.endsWith(".md") ? name : `${name}.md`;
        const fullPath = `${effectiveDir}/${fileName}`;
        await createFile(fullPath, `# ${name.replace(/\.md$/, "")}\n\n`);
      } else if (mode === "create-folder") {
        const fullPath = `${effectiveDir}/${name}`;
        await createFolder(fullPath);
      } else if (mode === "create-dashboard") {
        const fileName = name.endsWith(".dashboard.md")
          ? name
          : name.endsWith(".md")
            ? name.replace(/\.md$/, ".dashboard.md")
            : `${name}.dashboard.md`;
        const fullPath = `${effectiveDir}/${fileName}`;
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
        const oldPath = normalizePath(targetNodeToRename.path);
        const lastSlashIndex = oldPath.lastIndexOf("/");
        const parentPath =
          lastSlashIndex !== -1
            ? oldPath.substring(0, lastSlashIndex)
            : defaultDir;
        const newPath = `${parentPath}/${name}`;
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

  const normalizedTagFilter = activeTagFilter
    ? activeTagFilter.startsWith("#")
      ? activeTagFilter.toLowerCase()
      : `#${activeTagFilter.toLowerCase()}`
    : null;

  const matchesTag = (t: TaskItem) => {
    if (!normalizedTagFilter) return true;
    const tags = t.tags && t.tags.length > 0 ? t.tags : extractTags(t.title);
    return tags.some((tag) => tag.toLowerCase() === normalizedTagFilter);
  };

  const filteredTasks = tasks.filter(
    (t) => (activeFilter === "all" || t.state === activeFilter) && matchesTag(t)
  );

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
    all: tasks.filter(matchesTag).length,
    open: tasks.filter((t) => t.state === "open" && matchesTag(t)).length,
    in_progress: tasks.filter((t) => t.state === "in_progress" && matchesTag(t))
      .length,
    blocked: tasks.filter((t) => t.state === "blocked" && matchesTag(t)).length,
    completed: tasks.filter((t) => t.state === "completed" && matchesTag(t))
      .length,
  };

  interface TaskTreeNode {
    name: string;
    path: string;
    fullPath?: string;
    kind: "folder" | "note";
    children: TaskTreeNode[];
    tasks: TaskItem[];
  }

  const buildTaskTree = (filteredTaskList: TaskItem[]): TaskTreeNode[] => {
    const rootNodes: TaskTreeNode[] = [];
    const nodeMap = new Map<string, TaskTreeNode>();

    for (const task of filteredTaskList) {
      const normFile = stripWorkspacePrefix(task.sourceFile, workspaceDir);
      const parts = normFile.split("/").filter(Boolean);
      let currentPath = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const prevPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        let node = nodeMap.get(currentPath);
        if (!node) {
          node = {
            name: part,
            path: currentPath,
            kind: isFile ? "note" : "folder",
            children: [],
            tasks: [],
          };
          nodeMap.set(currentPath, node);

          if (prevPath) {
            const parentNode = nodeMap.get(prevPath);
            if (parentNode) {
              parentNode.children.push(node);
            }
          } else {
            rootNodes.push(node);
          }
        }

        if (isFile) {
          node.fullPath = task.sourceFile;
          node.tasks.push(task);
        }
      }
    }

    return rootNodes;
  };

  const toggleTaskNodeExpand = (nodePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedTaskNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodePath)) {
        next.delete(nodePath);
      } else {
        next.add(nodePath);
      }
      return next;
    });
  };

  const renderTaskTreeNode = (node: TaskTreeNode, depth: number = 0) => {
    const isExpanded = !collapsedTaskNodes.has(node.path);

    if (node.kind === "folder") {
      return (
        <div
          key={node.path}
          style={{ marginLeft: `${depth * 12}px`, marginBottom: "4px" }}
        >
          <div
            onClick={(e) => toggleTaskNodeExpand(node.path, e)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--rose-text)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span style={{ fontSize: "10px", width: "12px" }}>
              {isExpanded ? "▼" : "▶"}
            </span>
            <span>📁 {node.name}</span>
          </div>
          {isExpanded && (
            <div>
              {node.children.map((child) =>
                renderTaskTreeNode(child, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    // Note Node
    const allNoteTasks = tasks.filter((t) =>
      isSameFilePath(t.sourceFile, node.path, workspaceDir)
    );
    const noteCompletedCount = allNoteTasks.filter(
      (t) => t.state === "completed"
    ).length;
    const noteProgress =
      allNoteTasks.length > 0
        ? Math.round((noteCompletedCount / allNoteTasks.length) * 100)
        : 0;

    return (
      <div
        key={node.path}
        style={{ marginLeft: `${depth * 12}px`, marginBottom: "8px" }}
      >
        <div
          data-testid={`task-tree-note-${node.path}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 8px",
            backgroundColor: "rgba(38, 35, 58, 0.4)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            marginBottom: "4px",
          }}
          onClick={() => onSelectFile?.(node.fullPath || node.path)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              onClick={(e) => toggleTaskNodeExpand(node.path, e)}
              style={{ fontSize: "10px", width: "12px", cursor: "pointer" }}
            >
              {isExpanded ? "▼" : "▶"}
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--rose-text)",
              }}
            >
              📄 {node.name}
            </span>
          </div>
          <span
            data-testid={`note-progress-${node.path}`}
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--rose-foam)",
              backgroundColor: "rgba(156, 207, 216, 0.15)",
              padding: "2px 6px",
              borderRadius: "10px",
            }}
          >
            {noteProgress}%
          </span>
        </div>

        {isExpanded && (
          <div
            style={{
              paddingLeft: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {node.tasks.map((task) => {
              const badge = getBadgeStyle(task.state);
              const isCompleted = task.state === "completed";
              return (
                <div
                  key={task.id}
                  data-testid={`sidebar-task-item-${task.id}`}
                  data-task-state={task.state}
                  draggable={!isCompleted}
                  onDragStart={(e) => {
                    if (isCompleted) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({
                        taskTitle: task.title,
                        sourceFile: task.sourceFile,
                        priority: task.priority,
                      })
                    );
                    e.dataTransfer.setData(
                      "text/plain",
                      `task-drag:${task.title}`
                    );
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onToggleTask?.(task.id)}
                  role="button"
                  tabIndex={0}
                  className="tactile-card"
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--rose-bg-overlay)",
                    border: "1px solid rgba(110, 106, 134, 0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 150ms ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => {}}
                      style={{ cursor: "pointer" }}
                    />
                    <span
                      className={
                        isCompleted ? "task-completed-text" : "task-title-text"
                      }
                      style={{
                        fontSize: "12px",
                        color: isCompleted
                          ? "var(--rose-subtle)"
                          : "var(--rose-text)",
                        textDecoration: isCompleted ? "line-through" : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <button
                      data-testid={`move-task-btn-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovingTask(task);
                      }}
                      className="tactile-btn"
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(38, 35, 58, 0.6)",
                        color: "var(--rose-subtle)",
                        border: "1px solid rgba(110, 106, 134, 0.25)",
                        cursor: "pointer",
                      }}
                      title="Move task to another note"
                    >
                      ↪ Move
                    </button>
                    <button
                      data-testid={`delete-task-btn-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${task.title}"?`
                          )
                        ) {
                          onDeleteTask?.(task.id);
                        }
                      }}
                      className="tactile-btn"
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(38, 35, 58, 0.6)",
                        color: "var(--rose-love, #eb6f92)",
                        border: "1px solid rgba(235, 111, 146, 0.25)",
                        cursor: "pointer",
                      }}
                      title="Delete task"
                    >
                      🗑️
                    </button>
                    {(task.tags && task.tags.length > 0
                      ? task.tags
                      : extractTags(task.title)
                    ).map((tag) => (
                      <span
                        key={tag}
                        data-testid={`sidebar-task-tag-${task.id}-${tag}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTag?.(tag);
                        }}
                        className="tactile-btn"
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "1px 5px",
                          borderRadius: "3px",
                          backgroundColor: "rgba(196, 167, 231, 0.15)",
                          color: "var(--rose-iris)",
                          border: "1px solid rgba(196, 167, 231, 0.25)",
                          cursor: onSelectTag ? "pointer" : "default",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
      {/* Pinned Dashboards Bar */}
      <PinnedDashboards
        dashboards={pinnedDashboards}
        activeDashboardPath={activeFilePath}
        onSelectDashboard={(path) => onSelectFile?.(path)}
      />

      {/* Active Tag Filter Banner */}
      {activeTagFilter && (
        <div
          data-testid="sidebar-tag-filter-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "rgba(196, 167, 231, 0.15)",
            borderBottom: "1px solid rgba(196, 167, 231, 0.3)",
            color: "var(--rose-iris)",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Filtered by</span>
            <span
              style={{
                backgroundColor: "rgba(196, 167, 231, 0.25)",
                color: "var(--rose-iris)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
              }}
            >
              {activeTagFilter.startsWith("#")
                ? activeTagFilter
                : `#${activeTagFilter}`}
            </span>
          </div>
          <button
            type="button"
            data-testid="clear-tag-filter-btn"
            onClick={onClearTagFilter}
            title="Clear tag filter"
            className="tactile-btn"
            style={{
              background: "none",
              border: "none",
              color: "var(--rose-iris)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              padding: "2px 6px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}

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
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setActiveTab("files");
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setActiveTab("files");
          }}
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
          Tasks ({(activeFileTasks ?? tasks).filter(matchesTag).length})
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
              gap: "4px",
              borderBottom: "1px solid rgba(110, 106, 134, 0.15)",
              backgroundColor: "rgba(38, 35, 58, 0.3)",
              flexWrap: "wrap",
            }}
          >
            <button
              data-testid="sidebar-action-new-note"
              onClick={() => handleOpenCreateModal("create-note")}
              className="tactile-btn"
              style={{
                flex: "1 1 auto",
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
                flex: "1 1 auto",
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
              data-testid="sidebar-action-import-folder"
              onClick={() => importFolderInputRef.current?.click()}
              className="tactile-btn"
              title="Import folder (.txt files will be converted to .md)"
              style={{
                flex: "1 1 auto",
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 6px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(156, 207, 216, 0.3)",
                backgroundColor: "rgba(156, 207, 216, 0.15)",
                color: "var(--rose-foam)",
                cursor: "pointer",
              }}
            >
              Import Folder
            </button>
            <button
              data-testid="sidebar-action-new-dashboard"
              onClick={() => handleOpenCreateModal("create-dashboard")}
              className="tactile-btn"
              style={{
                flex: "1 1 auto",
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
            <input
              type="file"
              data-testid="import-folder-input"
              ref={importFolderInputRef}
              style={{ display: "none" }}
              {...({ webkitdirectory: "", directory: "" } as any)}
              multiple
              onChange={handleImportFolder}
            />
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
            workspaceDir={workspaceDir}
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

          {/* Task Tree */}
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
              buildTaskTree(filteredTasks).map((node) =>
                renderTaskTreeNode(node, 0)
              )
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

      {/* Move Task Modal */}
      {movingTask && (
        <div
          data-testid="move-task-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setMovingTask(null)}
        >
          <div
            style={{
              backgroundColor: "var(--rose-bg-surface)",
              border: "1px solid var(--rose-border-color)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              width: "320px",
              boxShadow: "var(--rose-shadow)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "14px",
                color: "var(--rose-pink)",
              }}
            >
              Move Task to Note
            </h3>
            <p
              style={{
                margin: "0 0 12px 0",
                fontSize: "12px",
                color: "var(--rose-subtle)",
              }}
            >
              Select target note for &quot;{movingTask.title}&quot;:
            </p>
            {availableNotes.length === 0 ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--rose-muted)",
                  margin: "0 0 16px 0",
                }}
              >
                No other notes found in workspace.
              </p>
            ) : (
              <select
                data-testid="move-task-target-select"
                value={selectedTargetNote}
                onChange={(e) => setSelectedTargetNote(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  marginBottom: "16px",
                  borderRadius: "4px",
                  backgroundColor: "var(--rose-bg-overlay)",
                  color: "var(--rose-text)",
                  border: "1px solid rgba(110, 106, 134, 0.3)",
                  fontSize: "12px",
                }}
              >
                {availableNotes.map((note) => (
                  <option key={note.path} value={note.path}>
                    {note.name || note.path}
                  </option>
                ))}
              </select>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                onClick={() => setMovingTask(null)}
                className="tactile-btn"
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  border: "1px solid rgba(110, 106, 134, 0.3)",
                  backgroundColor: "transparent",
                  color: "var(--rose-subtle)",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                data-testid="move-task-confirm-btn"
                disabled={availableNotes.length === 0}
                onClick={() => {
                  if (selectedTargetNote && onMoveTaskToNote) {
                    onMoveTaskToNote(
                      movingTask.title,
                      movingTask.sourceFile,
                      selectedTargetNote,
                      movingTask.priority
                    );
                  }
                  setMovingTask(null);
                }}
                className="tactile-btn"
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "var(--rose-pink)",
                  color: "#191724",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor:
                    availableNotes.length === 0 ? "not-allowed" : "pointer",
                  opacity: availableNotes.length === 0 ? 0.5 : 1,
                }}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
