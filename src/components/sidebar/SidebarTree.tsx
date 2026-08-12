import React, { useState } from "react";
import { FileTreeNode } from "../../types/workspaceTree";
import { isSameFilePath } from "../../services/fileService";

export interface SidebarTreeProps {
  nodes: FileTreeNode[];
  activeFilePath?: string;
  onSelectFile: (node: FileTreeNode) => void;
  onCreateNote: (targetFolderPath?: string) => void;
  onCreateFolder: (targetFolderPath?: string) => void;
  onCreateDashboard: (targetFolderPath?: string) => void;
  onRename: (node: FileTreeNode) => void;
  onDelete: (node: FileTreeNode) => void;
  onMovePath: (sourcePath: string, targetFolderPath: string) => void;
  onMoveTaskToNote?: (
    taskTitle: string,
    sourceFile: string,
    targetNotePath: string,
    priority?: string
  ) => void;
  workspaceDir?: string;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({
  nodes,
  activeFilePath,
  onSelectFile,
  onCreateNote,
  onCreateFolder,
  onCreateDashboard,
  onRename,
  onDelete,
  onMovePath,
  onMoveTaskToNote,
  workspaceDir,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set([""])
  );
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, node: FileTreeNode) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, targetNode: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    const types = e.dataTransfer?.types;
    const isTaskDrag = types
      ? Array.from(types).includes("application/json")
      : false;

    if (isTaskDrag) {
      if (targetNode.kind === "file" && targetNode.path.endsWith(".md")) {
        e.dataTransfer.dropEffect = "move";
        setDragOverPath(targetNode.path);
      } else {
        e.dataTransfer.dropEffect = "none";
      }
    } else {
      e.dataTransfer.dropEffect = "move";
      setDragOverPath(targetNode.path);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetNode: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    const types = e.dataTransfer?.types;
    const isTaskDrag = types
      ? Array.from(types).includes("application/json")
      : false;
    if (isTaskDrag) {
      if (targetNode.kind === "file" && targetNode.path.endsWith(".md")) {
        e.dataTransfer.dropEffect = "move";
        setDragOverPath(targetNode.path);
      } else {
        e.dataTransfer.dropEffect = "none";
      }
    } else {
      e.dataTransfer.dropEffect = "move";
      setDragOverPath(targetNode.path);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetNode: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear drag over if leaving to an external element outside this target
    if (
      dragOverPath === targetNode.path &&
      !e.currentTarget.contains(e.relatedTarget as Node)
    ) {
      setDragOverPath(null);
    }
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverPath("__root__");
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      dragOverPath === "__root__" &&
      !e.currentTarget.contains(e.relatedTarget as Node)
    ) {
      setDragOverPath(null);
    }
  };

  const handleDropOnNode = (e: React.DragEvent, targetNode: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);

    const plainTextData = e.dataTransfer.getData("text/plain");
    let taskTitleFromFallback = "";
    if (plainTextData && plainTextData.startsWith("task-drag:")) {
      taskTitleFromFallback = plainTextData.substring("task-drag:".length);
    }

    const taskDataStr = e.dataTransfer.getData("application/json");
    let payloadTitle = "";
    let payloadSource = "";
    let payloadPriority: string | undefined = undefined;
    if (taskDataStr && taskDataStr.trim().startsWith("{")) {
      try {
        const payload = JSON.parse(taskDataStr);
        if (payload && payload.taskTitle) {
          payloadTitle = payload.taskTitle;
          payloadSource = payload.sourceFile || "";
          payloadPriority = payload.priority || undefined;
        }
      } catch (err) {
        console.warn("Failed to parse task payload:", err);
      }
    }

    const finalTaskTitle = payloadTitle || taskTitleFromFallback;
    if (finalTaskTitle) {
      if (targetNode.kind === "file" && targetNode.path.endsWith(".md")) {
        onMoveTaskToNote?.(
          finalTaskTitle,
          payloadSource,
          targetNode.path,
          payloadPriority
        );
      }
      return;
    }

    const sourcePath = plainTextData;
    if (!sourcePath || sourcePath.startsWith("task-drag:")) return;

    let targetDir = "";
    if (targetNode.kind === "folder") {
      targetDir = targetNode.path;
    } else {
      const lastSlashIndex = targetNode.path.lastIndexOf("/");
      targetDir =
        lastSlashIndex !== -1
          ? targetNode.path.substring(0, lastSlashIndex)
          : "";
    }

    if (sourcePath !== targetDir && !targetDir.startsWith(sourcePath + "/")) {
      onMovePath(sourcePath, targetDir);
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);

    const sourcePath = e.dataTransfer.getData("text/plain");
    if (!sourcePath || sourcePath.startsWith("task-drag:")) return;

    const effectiveWorkspace = workspaceDir || "";
    const lastSlashIndex = sourcePath.lastIndexOf("/");
    const currentParentDir =
      lastSlashIndex !== -1 ? sourcePath.substring(0, lastSlashIndex) : "";

    if (currentParentDir !== effectiveWorkspace && currentParentDir !== "") {
      onMovePath(sourcePath, effectiveWorkspace);
    }
  };

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isFolder = node.kind === "folder";
    const isDashboard = node.kind === "dashboard" || node.isDashboard;
    const isExpanded = expandedPaths.has(node.path);
    const isActive = isSameFilePath(
      activeFilePath || "",
      node.path,
      workspaceDir
    );
    const isDragTarget = dragOverPath === node.path;

    return (
      <div key={node.path} style={{ display: "flex", flexDirection: "column" }}>
        <div
          data-testid={`tree-node-${node.path}`}
          data-kind={node.kind}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragEnter={(e) => handleDragEnter(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={(e) => handleDragLeave(e, node)}
          onDrop={(e) => handleDropOnNode(e, node)}
          onClick={() => {
            if (isFolder) {
              setExpandedPaths((prev) => {
                const next = new Set(prev);
                if (next.has(node.path)) next.delete(node.path);
                else next.add(node.path);
                return next;
              });
            } else {
              onSelectFile(node);
            }
          }}
          className="tactile-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: `${12 + depth * 14}px`,
            paddingRight: "8px",
            paddingTop: "6px",
            paddingBottom: "6px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: isActive
              ? "rgba(235, 111, 146, 0.15)"
              : isDragTarget
                ? "rgba(156, 207, 216, 0.2)"
                : "transparent",
            border: isDragTarget
              ? "1px dashed var(--rose-foam)"
              : isActive
                ? "1px solid rgba(235, 111, 146, 0.3)"
                : "1px solid transparent",
            cursor: "pointer",
            marginBottom: "2px",
          }}
        >
          {/* Left: Icon & Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isFolder ? (
              <span
                onClick={(e) => toggleExpand(node.path, e)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: "var(--rose-gold)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                    marginRight: "2px",
                  }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <svg
                  data-testid="icon-folder"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isExpanded ? (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  ) : (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  )}
                </svg>
              </span>
            ) : isDashboard ? (
              <svg
                data-testid="icon-dashboard"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--rose-pink)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            ) : (
              <svg
                data-testid="icon-note"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--rose-text)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )}

            <span
              style={{
                fontSize: "12px",
                fontWeight: isFolder ? 600 : 400,
                color: isFolder
                  ? "var(--rose-gold)"
                  : isDashboard
                    ? "var(--rose-pink)"
                    : "var(--rose-text)",
                fontFamily: isFolder ? "var(--font-ui)" : "var(--font-mono)",
              }}
            >
              {node.name}
            </span>
          </div>

          {/* Right: Inline Hover Actions */}
          <div
            className="node-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isFolder && (
              <>
                <button
                  data-testid={`node-add-note-${node.path}`}
                  title="Add Note"
                  onClick={() => onCreateNote(node.path)}
                  style={actionBtnStyle}
                >
                  +N
                </button>
                <button
                  data-testid={`node-add-folder-${node.path}`}
                  title="Add Folder"
                  onClick={() => onCreateFolder(node.path)}
                  style={actionBtnStyle}
                >
                  +F
                </button>
                <button
                  data-testid={`node-add-dashboard-${node.path}`}
                  title="Add Dashboard"
                  onClick={() => onCreateDashboard(node.path)}
                  style={actionBtnStyle}
                >
                  +D
                </button>
              </>
            )}
            {(() => {
              const effectiveWorkspace = workspaceDir || "";
              const lastSlash = node.path.lastIndexOf("/");
              const parentDir =
                lastSlash !== -1 ? node.path.substring(0, lastSlash) : "";

              if (parentDir && parentDir !== effectiveWorkspace) {
                return (
                  <button
                    data-testid={`node-move-root-${node.path}`}
                    title="Move out of folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      const grandParentSlash = parentDir.lastIndexOf("/");
                      const targetDir =
                        grandParentSlash !== -1
                          ? parentDir.substring(0, grandParentSlash)
                          : effectiveWorkspace;
                      onMovePath(node.path, targetDir);
                    }}
                    style={actionBtnStyle}
                  >
                    ↖
                  </button>
                );
              }
              return null;
            })()}
            <button
              data-testid={`node-rename-${node.path}`}
              title="Rename"
              onClick={() => onRename(node)}
              style={actionBtnStyle}
            >
              ✎
            </button>
            <button
              data-testid={`node-delete-${node.path}`}
              title="Delete"
              onClick={() => onDelete(node)}
              style={{ ...actionBtnStyle, color: "var(--rose-pink)" }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Render Folder Children */}
        {isFolder &&
          isExpanded &&
          node.children &&
          node.children.length > 0 && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
      </div>
    );
  };

  const isRootDragTarget = dragOverPath === "__root__";

  return (
    <div
      data-testid="sidebar-tree-container"
      onDragOver={handleRootDragOver}
      onDragLeave={handleRootDragLeave}
      onDrop={handleDropOnRoot}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 6px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isRootDragTarget
          ? "rgba(156, 207, 216, 0.08)"
          : "transparent",
        border: isRootDragTarget
          ? "1px dashed var(--rose-foam)"
          : "1px solid transparent",
        borderRadius: "var(--radius-sm)",
        transition: "all 150ms ease",
        position: "relative",
      }}
    >
      {isRootDragTarget && (
        <div
          data-testid="root-drop-zone"
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            right: "8px",
            pointerEvents: "none",
            zIndex: 10,
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(156, 207, 216, 0.2)",
            border: "1px dashed var(--rose-foam)",
            color: "var(--rose-foam)",
            fontSize: "11px",
            fontWeight: 600,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
          }}
        >
          Drop here to move to V-Folder Root
        </div>
      )}
      {nodes.length === 0 ? (
        <div
          data-testid="empty-tree-message"
          style={{
            padding: "24px 12px",
            textAlign: "center",
            color: "var(--rose-subtle)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
          }}
        >
          No notes or folders found
        </div>
      ) : (
        nodes.map((node) => renderNode(node, 0))
      )}
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--rose-subtle)",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  padding: "2px 4px",
  borderRadius: "3px",
  lineHeight: 1,
};
