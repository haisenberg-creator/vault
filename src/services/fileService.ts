import { invoke } from "@tauri-apps/api/core";
import { FileTreeNode, FileKind } from "../types/workspaceTree";

export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
}

type WorkspaceChangeListener = () => void;
const workspaceListeners: Set<WorkspaceChangeListener> = new Set();

// In-memory mock file storage for browser testing / non-Tauri execution
const mockStorage: Map<string, string> = new Map([
  [
    "workspace-note.md",
    `# Workspace Project Roadmap

Welcome to the Rosé Pine Moon Soho Vault app. Tasks within plain Markdown files are automatically aggregated into the Task Dashboard on the left sidebar.

## Immediate Milestones

- [x] Set up Dual Column layout shell with Rosé Pine tokens
- [-] Integrate Tauri file system commands for reading/writing markdown
- [ ] Lexical editor Markdown transformer & DecoratorNode integration
- [>] Custom interactive checklist portal node renderer
`,
  ],
]);

// In-memory mock set for explicit folder paths (e.g. empty directories)
const mockStorageFolders: Set<string> = new Set();

/**
 * Normalizes file paths to use forward slashes consistently
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$|^(?:\.\/)+/g, "");
}

/**
 * Check if running inside a Tauri application environment
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Reads markdown text content from the specified file path.
 */
export async function readMarkdownFile(path: string): Promise<string> {
  const normPath = normalizePath(path);
  if (isTauriEnvironment()) {
    try {
      return await invoke<string>("read_file", { path: normPath });
    } catch (error) {
      console.warn(
        "Tauri invoke read_file failed, falling back to mock storage:",
        error
      );
    }
  }

  if (mockStorage.has(normPath)) {
    return mockStorage.get(normPath)!;
  }
  if (mockStorage.has(path)) {
    return mockStorage.get(path)!;
  }

  // Return empty default document if path not in mock storage
  return `# New Note (${path})\n\nStart typing your note here...\n`;
}

/**
 * Writes markdown text content to the specified file path.
 */
export async function writeMarkdownFile(
  path: string,
  content: string
): Promise<void> {
  const normPath = normalizePath(path);
  if (isTauriEnvironment()) {
    try {
      await invoke("write_file", { path: normPath, content });
      mockStorage.set(normPath, content);
      notifyWorkspaceChange();
      return;
    } catch (error) {
      console.warn(
        "Tauri invoke write_file failed, persisting to mock storage:",
        error
      );
    }
  }

  mockStorage.set(normPath, content);
  notifyWorkspaceChange();
}

/**
 * Reads all .md files recursively in the specified target workspace folder.
 */
export async function readWorkspaceFiles(
  dirPath: string = "workspace"
): Promise<WorkspaceFile[]> {
  if (isTauriEnvironment()) {
    try {
      const files = await invoke<WorkspaceFile[]>("read_workspace_files", {
        dirPath,
      });
      return files;
    } catch (error) {
      console.warn(
        "Tauri invoke read_workspace_files failed, falling back to mock storage:",
        error
      );
    }
  }

  const result: WorkspaceFile[] = [];
  mockStorage.forEach((content, path) => {
    const normPath = normalizePath(path);
    if (normPath.endsWith(".md")) {
      const name = normPath.split("/").pop() || normPath;
      result.push({ path: normPath, name, content });
    }
  });
  return result;
}

/**
 * Helper to check if a file's content or path indicates a Dashboard file
 */
function checkIsDashboard(path: string, content?: string): boolean {
  const normPath = normalizePath(path);
  if (normPath.endsWith(".dashboard.md")) {
    return true;
  }
  if (content) {
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (frontmatterMatch && frontmatterMatch[1].includes("type: dashboard")) {
      return true;
    }
  }
  return false;
}

/**
 * Constructs a hierarchical FileTreeNode tree from mock memory storage
 */

export function buildTreeFromMockStorage(): FileTreeNode[] {
  interface MutableNode {
    id: string;
    name: string;
    path: string;
    kind: FileKind;
    isDashboard?: boolean;
    childrenMap?: Map<string, MutableNode>;
  }

  const rootChildrenMap = new Map<string, MutableNode>();

  const processPath = (rawPath: string, isFolder: boolean) => {
    const normPath = normalizePath(rawPath);
    if (!normPath) return;

    const parts = normPath.split("/");
    let currentMap = rootChildrenMap;
    let currentPathAccumulator = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      currentPathAccumulator = currentPathAccumulator
        ? `${currentPathAccumulator}/${part}`
        : part;

      if (isLast && !isFolder) {
        const content = mockStorage.get(rawPath) ?? mockStorage.get(normPath);
        const isDashboard = checkIsDashboard(normPath, content);
        const kind: FileKind = isDashboard ? "dashboard" : "file";

        currentMap.set(part, {
          id: currentPathAccumulator,
          name: part,
          path: currentPathAccumulator,
          kind,
          isDashboard,
        });
      } else {
        let folderNode = currentMap.get(part);
        if (!folderNode) {
          folderNode = {
            id: currentPathAccumulator,
            name: part,
            path: currentPathAccumulator,
            kind: "folder",
            childrenMap: new Map<string, MutableNode>(),
          };
          currentMap.set(part, folderNode);
        }
        if (!folderNode.childrenMap) {
          folderNode.childrenMap = new Map<string, MutableNode>();
        }
        currentMap = folderNode.childrenMap;
      }
    }
  };

  mockStorageFolders.forEach((folderPath) => processPath(folderPath, true));
  mockStorage.forEach((_, filePath) => processPath(filePath, false));

  const convertMapToArray = (map: Map<string, MutableNode>): FileTreeNode[] => {
    const nodes: FileTreeNode[] = [];
    map.forEach((node) => {
      if (node.kind === "folder") {
        const children = node.childrenMap
          ? convertMapToArray(node.childrenMap)
          : [];
        nodes.push({
          id: node.id,
          name: node.name,
          path: node.path,
          kind: "folder",
          children,
        });
      } else {
        nodes.push({
          id: node.id,
          name: node.name,
          path: node.path,
          kind: node.kind,
          isDashboard: node.isDashboard,
        });
      }
    });

    nodes.sort((a, b) => {
      if (a.kind === "folder" && b.kind !== "folder") return -1;
      if (a.kind !== "folder" && b.kind === "folder") return 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  };

  return convertMapToArray(rootChildrenMap);
}

/**
 * Reads the nested directory tree of the Vault workspace.
 */
export async function readWorkspaceTree(
  dirPath: string = "workspace"
): Promise<FileTreeNode[]> {
  if (isTauriEnvironment()) {
    try {
      const tree = await invoke<FileTreeNode[]>("read_workspace_tree", {
        dirPath,
      });
      return tree;
    } catch (error) {
      console.warn(
        "Tauri invoke read_workspace_tree failed, falling back to mock storage:",
        error
      );
    }
  }

  return buildTreeFromMockStorage();
}

/**
 * Creates a new directory inside the Vault workspace.
 */
export async function createFolder(folderPath: string): Promise<void> {
  const normPath = normalizePath(folderPath);
  if (!normPath) return;

  if (isTauriEnvironment()) {
    try {
      await invoke("create_folder", { path: normPath });
      mockStorageFolders.add(normPath);
      notifyWorkspaceChange();
      return;
    } catch (error) {
      console.warn(
        "Tauri invoke create_folder failed, persisting to mock storage:",
        error
      );
    }
  }

  mockStorageFolders.add(normPath);
  notifyWorkspaceChange();
}

/**
 * Creates a new file inside the Vault workspace.
 */
export async function createFile(
  filePath: string,
  content: string = ""
): Promise<void> {
  await writeMarkdownFile(filePath, content);
}

/**
 * Deletes a file or directory recursively from the Vault workspace.
 */
export async function deletePath(targetPath: string): Promise<void> {
  const normTarget = normalizePath(targetPath);
  if (!normTarget) return;

  if (isTauriEnvironment()) {
    try {
      await invoke("delete_path", { path: normTarget });
    } catch (error) {
      console.warn(
        "Tauri invoke delete_path failed, updating mock storage:",
        error
      );
    }
  }

  mockStorage.delete(normTarget);
  mockStorage.delete(targetPath);
  mockStorageFolders.delete(normTarget);

  const filePrefix = normTarget + "/";
  for (const key of Array.from(mockStorage.keys())) {
    if (normalizePath(key).startsWith(filePrefix)) {
      mockStorage.delete(key);
    }
  }
  for (const folder of Array.from(mockStorageFolders.values())) {
    if (folder.startsWith(filePrefix) || folder === normTarget) {
      mockStorageFolders.delete(folder);
    }
  }

  notifyWorkspaceChange();
}

/**
 * Renames a file or folder in the Vault workspace.
 */
export async function renamePath(
  oldPath: string,
  newPath: string
): Promise<void> {
  const normOld = normalizePath(oldPath);
  const normNew = normalizePath(newPath);
  if (!normOld || !normNew || normOld === normNew) return;

  if (isTauriEnvironment()) {
    try {
      await invoke("rename_path", { oldPath: normOld, newPath: normNew });
    } catch (error) {
      console.warn(
        "Tauri invoke rename_path failed, updating mock storage:",
        error
      );
    }
  }

  if (mockStorage.has(normOld) || mockStorage.has(oldPath)) {
    const content = mockStorage.get(normOld) ?? mockStorage.get(oldPath) ?? "";
    mockStorage.delete(normOld);
    mockStorage.delete(oldPath);
    mockStorage.set(normNew, content);
  }

  if (mockStorageFolders.has(normOld)) {
    mockStorageFolders.delete(normOld);
    mockStorageFolders.add(normNew);
  }

  const oldPrefix = normOld + "/";
  for (const [key, content] of Array.from(mockStorage.entries())) {
    const normKey = normalizePath(key);
    if (normKey.startsWith(oldPrefix)) {
      const updatedKey = normNew + normKey.slice(normOld.length);
      mockStorage.delete(key);
      mockStorage.set(updatedKey, content);
    }
  }

  for (const folder of Array.from(mockStorageFolders.values())) {
    if (folder.startsWith(oldPrefix)) {
      const updatedFolder = normNew + folder.slice(normOld.length);
      mockStorageFolders.delete(folder);
      mockStorageFolders.add(updatedFolder);
    }
  }

  notifyWorkspaceChange();
}

/**
 * Moves a file or folder into a destination target folder.
 */
export async function movePath(
  sourcePath: string,
  targetFolderPath: string
): Promise<void> {
  const normSource = normalizePath(sourcePath);
  const normTargetDir = normalizePath(targetFolderPath);
  const fileName = normSource.split("/").pop() || normSource;
  const destinationPath = normTargetDir
    ? `${normTargetDir}/${fileName}`
    : fileName;
  await renamePath(normSource, destinationPath);
}

/**
 * Subscribe to workspace file updates (e.g. when files or folders are modified)
 */
export function subscribeToWorkspaceChanges(
  listener: WorkspaceChangeListener
): () => void {
  workspaceListeners.add(listener);
  return () => {
    workspaceListeners.delete(listener);
  };
}

function notifyWorkspaceChange() {
  workspaceListeners.forEach((listener) => listener());
}

/**
 * Helper to set initial or mock content in memory (useful for tests)
 */
export function setMockFileContent(path: string, content: string): void {
  const normPath = normalizePath(path);
  mockStorage.set(normPath, content);
  notifyWorkspaceChange();
}

/**
 * Helper to get mock content from memory (useful for tests)
 */
export function getMockFileContent(path: string): string | undefined {
  const normPath = normalizePath(path);
  return mockStorage.get(normPath) ?? mockStorage.get(path);
}

/**
 * Helper to clear mock storage (useful for resetting tests)
 */
export function clearMockStorage(): void {
  mockStorage.clear();
  mockStorageFolders.clear();
  notifyWorkspaceChange();
}
