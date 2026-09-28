import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Archive,
  X,
  Folder,
  FolderOpen,
  FileText,
  LayoutDashboard,
  CheckSquare,
  Square,
  MinusSquare,
  ChevronRight,
  ChevronDown,
  Download,
} from "lucide-react";
import { FileTreeNode } from "../../types/workspaceTree";
import {
  readWorkspaceTree,
  exportSelectiveVaultZip,
} from "../../services/fileService";

export interface ExportArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceDir?: string;
  tree?: FileTreeNode[];
  onExport?: (selectedRelativePaths: string[]) => Promise<void> | void;
}

/**
 * Recursively collects all file nodes (.md and dashboards) under the given nodes.
 */
function getAllFileNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  const files: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "file" || node.kind === "dashboard") {
      files.push(node);
    }
    if (node.children && node.children.length > 0) {
      files.push(...getAllFileNodes(node.children));
    }
  }
  return files;
}

/**
 * Recursively collects all folder nodes under the given nodes.
 */
function getAllFolderNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  const folders: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "folder") {
      folders.push(node);
    }
    if (node.children && node.children.length > 0) {
      folders.push(...getAllFolderNodes(node.children));
    }
  }
  return folders;
}

/**
 * Collects all descendant file nodes under a specific node.
 */
function getDescendantFiles(node: FileTreeNode): FileTreeNode[] {
  if (node.kind === "file" || node.kind === "dashboard") {
    return [node];
  }
  if (!node.children || node.children.length === 0) {
    return [];
  }
  return getAllFileNodes(node.children);
}

interface TreeItemProps {
  node: FileTreeNode;
  level: number;
  selectedFilePaths: Set<string>;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onToggleNode: (node: FileTreeNode) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  selectedFilePaths,
  expandedPaths,
  onToggleExpand,
  onToggleNode,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const isFolder = node.kind === "folder";
  const isExpanded = expandedPaths.has(node.path);

  // Compute selection state
  const { isChecked, isIndeterminate } = useMemo(() => {
    if (!isFolder) {
      return {
        isChecked: selectedFilePaths.has(node.path),
        isIndeterminate: false,
      };
    }
    const descendantFiles = getDescendantFiles(node);
    if (descendantFiles.length === 0) {
      return { isChecked: false, isIndeterminate: false };
    }
    const checkedCount = descendantFiles.filter((f) =>
      selectedFilePaths.has(f.path)
    ).length;

    if (checkedCount === 0) {
      return { isChecked: false, isIndeterminate: false };
    }
    if (checkedCount === descendantFiles.length) {
      return { isChecked: true, isIndeterminate: false };
    }
    return { isChecked: false, isIndeterminate: true };
  }, [node, isFolder, selectedFilePaths]);

  // Keep native DOM indeterminate property in sync
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div>
      <div
        data-testid={`tree-node-${node.path}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "5px 8px",
          paddingLeft: `${level * 20 + 8}px`,
          borderRadius: "var(--radius-sm)",
          userSelect: "none",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
        }}
        className="tactile-btn"
        onClick={() => onToggleNode(node)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            onToggleNode(node);
          }
        }}
        tabIndex={0}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-checked={isIndeterminate ? "mixed" : isChecked}
      >
        {/* Expand / Collapse toggle for folders */}
        {isFolder ? (
          <button
            type="button"
            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.path);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--rose-muted)",
              width: "16px",
              height: "16px",
              flexShrink: 0,
            }}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <span style={{ width: "16px", height: "16px", flexShrink: 0 }} />
        )}

        {/* Checkbox */}
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
            position: "relative",
            margin: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={checkboxRef}
            type="checkbox"
            data-testid={`checkbox-${node.path}`}
            checked={isChecked}
            data-indeterminate={isIndeterminate ? "true" : "false"}
            aria-checked={isIndeterminate ? "mixed" : isChecked}
            onChange={() => onToggleNode(node)}
            style={{
              position: "absolute",
              opacity: 0,
              width: "16px",
              height: "16px",
              margin: 0,
              cursor: "pointer",
            }}
          />
          {isIndeterminate ? (
            <MinusSquare
              size={16}
              style={{ color: "var(--rose-gold)", flexShrink: 0 }}
            />
          ) : isChecked ? (
            <CheckSquare
              size={16}
              style={{ color: "var(--rose-pink)", flexShrink: 0 }}
            />
          ) : (
            <Square
              size={16}
              style={{ color: "var(--rose-muted)", flexShrink: 0 }}
            />
          )}
        </label>

        {/* Node Kind Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen
              size={15}
              style={{ color: "var(--rose-gold)", flexShrink: 0 }}
            />
          ) : (
            <Folder
              size={15}
              style={{ color: "var(--rose-gold)", flexShrink: 0 }}
            />
          )
        ) : node.kind === "dashboard" || node.isDashboard ? (
          <LayoutDashboard
            size={15}
            style={{ color: "var(--rose-pink)", flexShrink: 0 }}
          />
        ) : (
          <FileText
            size={15}
            style={{ color: "var(--rose-foam)", flexShrink: 0 }}
          />
        )}

        {/* Node Name */}
        <span
          style={{
            fontSize: "12px",
            color:
              isChecked || isIndeterminate
                ? "var(--rose-text)"
                : "var(--rose-subtle)",
            fontWeight: isFolder ? 600 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.name}
        </span>
      </div>

      {/* Render Children when folder is expanded */}
      {isFolder && isExpanded && node.children && node.children.length > 0 && (
        <div role="group">
          {node.children.map((child) => (
            <TreeItem
              key={child.id || child.path}
              node={child}
              level={level + 1}
              selectedFilePaths={selectedFilePaths}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onToggleNode={onToggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ExportArchiveModal: React.FC<ExportArchiveModalProps> = ({
  isOpen,
  onClose,
  workspaceDir,
  tree: initialTree,
  onExport,
}) => {
  const [tree, setTree] = useState<FileTreeNode[]>(initialTree || []);
  const [selectedFilePaths, setSelectedFilePaths] = useState<Set<string>>(
    new Set()
  );
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tree if not provided
  useEffect(() => {
    if (!isOpen) return;

    if (initialTree && initialTree.length > 0) {
      setTree(initialTree);
    } else {
      readWorkspaceTree(workspaceDir)
        .then((loaded) => setTree(loaded))
        .catch((err) => console.warn("Failed to load workspace tree:", err));
    }
  }, [isOpen, initialTree, workspaceDir]);

  // Collect all files and folders
  const allFiles = useMemo(() => getAllFileNodes(tree), [tree]);
  const allFolders = useMemo(() => getAllFolderNodes(tree), [tree]);

  // Initial selection: select all files and expand all folders
  useEffect(() => {
    if (!isOpen) return;
    const filePaths = new Set(allFiles.map((f) => f.path));
    setSelectedFilePaths(filePaths);

    const folderPaths = new Set(allFolders.map((f) => f.path));
    setExpandedPaths(folderPaths);
    setError(null);
  }, [isOpen, allFiles, allFolders]);

  // Count fully selected folders
  const selectedFoldersCount = useMemo(() => {
    let count = 0;
    for (const folder of allFolders) {
      const descendants = getDescendantFiles(folder);
      if (
        descendants.length > 0 &&
        descendants.every((f) => selectedFilePaths.has(f.path))
      ) {
        count++;
      }
    }
    return count;
  }, [allFolders, selectedFilePaths]);

  const selectedNotesCount = selectedFilePaths.size;
  const isAllSelected =
    allFiles.length > 0 && selectedFilePaths.size === allFiles.length;

  // Toggle master select all / deselect all
  const handleToggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedFilePaths(new Set());
    } else {
      setSelectedFilePaths(new Set(allFiles.map((f) => f.path)));
    }
  }, [isAllSelected, allFiles]);

  // Toggle individual node (folder or file)
  const handleToggleNode = useCallback((node: FileTreeNode) => {
    setSelectedFilePaths((prev) => {
      const next = new Set(prev);
      if (node.kind === "folder") {
        const descendantFiles = getDescendantFiles(node);
        const allDescendantsChecked = descendantFiles.every((f) =>
          next.has(f.path)
        );
        if (allDescendantsChecked) {
          // Uncheck all descendants
          descendantFiles.forEach((f) => next.delete(f.path));
        } else {
          // Check all descendants
          descendantFiles.forEach((f) => next.add(f.path));
        }
      } else {
        if (next.has(node.path)) {
          next.delete(node.path);
        } else {
          next.add(node.path);
        }
      }
      return next;
    });
  }, []);

  // Toggle expand / collapse of folder
  const handleToggleExpand = useCallback((folderPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  // Primary export action
  const handleExport = useCallback(async () => {
    if (selectedNotesCount === 0 || isExporting) return;
    setIsExporting(true);
    setError(null);

    const pathsToExport = Array.from(selectedFilePaths);

    try {
      if (onExport) {
        await onExport(pathsToExport);
      } else {
        const blob = await exportSelectiveVaultZip(pathsToExport, workspaceDir);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vault-archive.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch (err) {
      console.warn("Export archive error:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [
    selectedNotesCount,
    isExporting,
    selectedFilePaths,
    onExport,
    workspaceDir,
    onClose,
  ]);

  // Keyboard accessibility: Escape to close, Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "Enter") {
        // Only trigger export if target is not a button or clickable inside tree
        if (selectedNotesCount > 0 && !isExporting) {
          e.preventDefault();
          handleExport();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, handleExport, selectedNotesCount, isExporting]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="export-archive-modal"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 13, 22, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-archive-modal-title"
        style={{
          width: "520px",
          maxWidth: "92vw",
          maxHeight: "85vh",
          backgroundColor: "var(--rose-bg-surface)",
          border: "1px solid rgba(235, 111, 146, 0.25)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(110, 106, 134, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Archive size={18} color="var(--rose-pink)" />
            <div>
              <h3
                id="export-archive-modal-title"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--rose-text)",
                  margin: 0,
                  letterSpacing: "0.2px",
                }}
              >
                Export Vault Archive
              </h3>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--rose-subtle)",
                  margin: "2px 0 0 0",
                }}
              >
                Select folders and notes to include in the exported .zip
                archive.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="export-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            className="tactile-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--rose-subtle)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar: Master Toggle & Item Counter */}
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "rgba(31, 29, 46, 0.6)",
            borderBottom: "1px solid rgba(110, 106, 134, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            data-testid="export-modal-toggle-all"
            onClick={handleToggleSelectAll}
            className="tactile-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(110, 106, 134, 0.3)",
              backgroundColor: "rgba(38, 35, 58, 0.8)",
              color: "var(--rose-text)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {isAllSelected ? (
              <>
                <MinusSquare size={13} color="var(--rose-gold)" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare size={13} color="var(--rose-pink)" />
                <span>Select All</span>
              </>
            )}
          </button>

          <span
            data-testid="export-modal-counter"
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color:
                selectedNotesCount > 0
                  ? "var(--rose-foam)"
                  : "var(--rose-subtle)",
            }}
          >
            {`${selectedNotesCount} ${
              selectedNotesCount === 1 ? "note" : "notes"
            }, ${selectedFoldersCount} ${
              selectedFoldersCount === 1 ? "folder" : "folders"
            } selected`}
          </span>
        </div>

        {/* Tree Container */}
        <div
          data-testid="export-archive-tree"
          role="tree"
          style={{
            padding: "12px 16px",
            overflowY: "auto",
            maxHeight: "340px",
            minHeight: "140px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {tree.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--rose-subtle)",
                fontSize: "12px",
              }}
            >
              No notes or folders found in workspace.
            </div>
          ) : (
            tree.map((node) => (
              <TreeItem
                key={node.id || node.path}
                node={node}
                level={0}
                selectedFilePaths={selectedFilePaths}
                expandedPaths={expandedPaths}
                onToggleExpand={handleToggleExpand}
                onToggleNode={handleToggleNode}
              />
            ))
          )}
        </div>

        {/* Error message if any */}
        {error && (
          <div
            style={{
              padding: "6px 20px",
              fontSize: "11px",
              color: "var(--rose-love)",
              backgroundColor: "rgba(235, 111, 146, 0.1)",
            }}
          >
            {error}
          </div>
        )}

        {/* Modal Footer / Action buttons */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(110, 106, 134, 0.2)",
            backgroundColor: "rgba(31, 29, 46, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            data-testid="export-modal-cancel"
            onClick={onClose}
            className="tactile-btn"
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(110, 106, 134, 0.3)",
              backgroundColor: "transparent",
              color: "var(--rose-subtle)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            data-testid="export-modal-submit"
            disabled={selectedNotesCount === 0 || isExporting}
            onClick={handleExport}
            className="tactile-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor:
                selectedNotesCount > 0
                  ? "var(--rose-pink)"
                  : "rgba(110, 106, 134, 0.3)",
              color: selectedNotesCount > 0 ? "#191724" : "var(--rose-subtle)",
              fontSize: "12px",
              fontWeight: 600,
              cursor:
                selectedNotesCount > 0 && !isExporting
                  ? "pointer"
                  : "not-allowed",
              opacity: selectedNotesCount === 0 || isExporting ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
          >
            <Download size={13} />
            <span>{isExporting ? "Exporting..." : "Export (.zip)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
