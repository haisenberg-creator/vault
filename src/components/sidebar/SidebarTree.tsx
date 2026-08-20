import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  LayoutGrid,
  CornerLeftUp,
  Pencil,
  Trash2,
  Columns2,
} from "lucide-react";
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
  onOpenInSplitView?: (path: string) => void;
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
  onOpenInSplitView,
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
    let payloadState: string | undefined = undefined;
    if (taskDataStr && taskDataStr.trim().startsWith("{")) {
      try {
        const payload = JSON.parse(taskDataStr);
        if (payload && payload.taskTitle) {
          payloadTitle = payload.taskTitle;
          payloadSource = payload.sourceFile || "";
          payloadPriority = payload.priority || undefined;
          payloadState = payload.state;
        }
      } catch (err) {
        console.warn("Failed to parse task payload:", err);
      }
    }

    // Done/completed tasks cannot be moved across files via sidebar tree
    if (payloadState === "completed") {
      return;
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
          onContextMenu={(e) => {
            if (!isFolder && onOpenInSplitView) {
              e.preventDefault();
              onOpenInSplitView(node.path);
            }
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragEnter={(e) => handleDragEnter(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={(e) => handleDragLeave(e, node)}
          onDrop={(e) => handleDropOnNode(e, node)}
          className="tactile-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: `${10 + depth * 14}px`,
            paddingRight: "8px",
            paddingTop: "6px",
            paddingBottom: "6px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: isActive
              ? "rgba(235, 111, 146, 0.18)"
              : isDragTarget
                ? "rgba(156, 207, 216, 0.2)"
                : "transparent",
            border: isDragTarget
              ? "1px dashed var(--rose-foam)"
              : isActive
                ? "1px solid rgba(235, 111, 146, 0.4)"
                : "1px solid transparent",
            borderLeft: isActive
              ? "3px solid var(--rose-pink)"
              : isDragTarget
                ? "3px solid var(--rose-foam)"
                : "3px solid transparent",
            boxShadow: isActive
              ? "0 0 12px var(--rose-pink-glow, rgba(235, 111, 146, 0.35))"
              : "none",
            cursor: "pointer",
            marginBottom: "2px",
            transition: "all var(--transition-fast, 150ms ease)",
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
                  cursor: "pointer",
                  gap: "2px",
                }}
              >
                {isExpanded ? (
                  <ChevronDown
                    size={14}
                    style={{
                      transition: "transform 150ms ease",
                      color: "var(--rose-subtle)",
                    }}
                  />
                ) : (
                  <ChevronRight
                    size={14}
                    style={{
                      transition: "transform 150ms ease",
                      color: "var(--rose-subtle)",
                    }}
                  />
                )}
                {isExpanded ? (
                  <FolderOpen
                    data-testid="icon-folder"
                    size={16}
                    color="var(--rose-gold)"
                  />
                ) : (
                  <Folder
                    data-testid="icon-folder"
                    size={16}
                    color="var(--rose-gold)"
                  />
                )}
              </span>
            ) : isDashboard ? (
              <LayoutDashboard
                data-testid="icon-dashboard"
                size={16}
                color="var(--rose-pink)"
              />
            ) : (
              <FileText
                data-testid="icon-note"
                size={16}
                color={isActive ? "var(--rose-pink)" : "var(--rose-text)"}
              />
            )}

            <span
              style={{
                fontSize: "12px",
                fontWeight: isFolder ? 600 : isActive ? 600 : 400,
                color: isFolder
                  ? "var(--rose-gold)"
                  : isDashboard
                    ? "var(--rose-pink)"
                    : isActive
                      ? "var(--rose-rose)"
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
              gap: "2px",
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
                  className="tactile-btn"
                >
                  <FilePlus size={12} style={{ marginRight: "1px" }} />
                  <span>+N</span>
                </button>
                <button
                  data-testid={`node-add-folder-${node.path}`}
                  title="Add Folder"
                  onClick={() => onCreateFolder(node.path)}
                  style={actionBtnStyle}
                  className="tactile-btn"
                >
                  <FolderPlus size={12} style={{ marginRight: "1px" }} />
                  <span>+F</span>
                </button>
                <button
                  data-testid={`node-add-dashboard-${node.path}`}
                  title="Add Dashboard"
                  onClick={() => onCreateDashboard(node.path)}
                  style={actionBtnStyle}
                  className="tactile-btn"
                >
                  <LayoutGrid size={12} style={{ marginRight: "1px" }} />
                  <span>+D</span>
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
                    className="tactile-btn"
                  >
                    <CornerLeftUp size={12} />
                  </button>
                );
              }
              return null;
            })()}
            {!isFolder && onOpenInSplitView && (
              <button
                data-testid={`node-split-${node.path}`}
                title="Open in Split View"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInSplitView(node.path);
                }}
                style={actionBtnStyle}
                className="tactile-btn"
              >
                <Columns2 size={12} style={{ color: "var(--rose-foam)" }} />
              </button>
            )}
            <button
              data-testid={`node-rename-${node.path}`}
              title="Rename"
              onClick={() => onRename(node)}
              style={actionBtnStyle}
              className="tactile-btn"
            >
              <Pencil size={12} />
            </button>
            <button
              data-testid={`node-delete-${node.path}`}
              title="Delete"
              onClick={() => onDelete(node)}
              style={{ ...actionBtnStyle, color: "var(--rose-pink)" }}
              className="tactile-btn"
            >
              <Trash2 size={12} />
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
