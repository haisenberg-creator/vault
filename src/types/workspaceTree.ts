export type FileKind = "file" | "folder" | "dashboard";

/**
 * Node structure for Vault file/folder hierarchy tree
 */
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  kind: FileKind;
  isDashboard?: boolean;
  content?: string;
  children?: FileTreeNode[];
}

/**
 * Metadata info returned from backend file system scans
 */
export interface WorkspaceFileInfo {
  path: string;
  name: string;
  content: string;
  isDir?: boolean;
}
