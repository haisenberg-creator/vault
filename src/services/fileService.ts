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

const STORAGE_FILES_KEY = "vault_mock_storage_files_v1";
const STORAGE_FOLDERS_KEY = "vault_mock_storage_folders_v1";

function loadMockStorageFromLocalStorage(): void {
  try {
    if (typeof window === "undefined" || isTauriEnvironment()) return;
    const ls = window.localStorage;
    if (!ls) return;
    const filesJson = ls.getItem(STORAGE_FILES_KEY);
    if (filesJson) {
      const parsedFiles: [string, string][] = JSON.parse(filesJson);
      mockStorage.clear();
      parsedFiles.forEach(([key, val]) => mockStorage.set(key, val));
    }
    const foldersJson = ls.getItem(STORAGE_FOLDERS_KEY);
    if (foldersJson) {
      const parsedFolders: string[] = JSON.parse(foldersJson);
      mockStorageFolders.clear();
      parsedFolders.forEach((f) => mockStorageFolders.add(f));
    }
  } catch (err) {
    console.warn("Failed to load mock storage from localStorage:", err);
  }
}

function saveMockStorageToLocalStorage(): void {
  try {
    if (typeof window === "undefined" || isTauriEnvironment()) return;
    const ls = window.localStorage;
    if (!ls) return;
    const filesArray = Array.from(mockStorage.entries());
    ls.setItem(STORAGE_FILES_KEY, JSON.stringify(filesArray));
    const foldersArray = Array.from(mockStorageFolders.values());
    ls.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(foldersArray));
  } catch (err) {
    console.warn("Failed to save mock storage to localStorage:", err);
  }
}

// Load persisted mock state if running in browser
loadMockStorageFromLocalStorage();

/**
 * Normalizes file paths to use forward slashes consistently
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$|^(?:\.\/)+/g, "");
}

/**
 * Strip optional workspace directory prefix from path (e.g. "workspace/" or "workspaceDir/" or absolute workspace path)
 */
export function stripWorkspacePrefix(
  path: string,
  workspaceDir: string = "workspace"
): string {
  if (!path) return "";
  const norm = normalizePath(path);
  const normWs = workspaceDir ? normalizePath(workspaceDir) : "";
  if (normWs && norm.startsWith(normWs + "/")) {
    return norm.substring(normWs.length + 1);
  }
  if (norm.startsWith("workspace/")) {
    return norm.substring("workspace/".length);
  }
  const workspaceMatch = norm.match(/(?:^|\/)workspace\/(.+)$/i);
  if (workspaceMatch) {
    return workspaceMatch[1];
  }
  return norm;
}

/**
 * Format path for TitleBar to display at most the last two path segments (e.g. "Projects/Vault.md").
 * Single segment paths display as-is without leading slashes.
 */
export function formatShortPath(
  path: string,
  workspaceDir: string = "workspace"
): string {
  if (!path) return "";
  const relative = stripWorkspacePrefix(path, workspaceDir);
  const segments = relative.split("/").filter(Boolean);
  if (segments.length <= 2) {
    return segments.join("/");
  }
  return segments.slice(-2).join("/");
}

/**
 * Compares two file paths to determine if they refer to the same file,
 * handling backslashes, forward slashes, and optional workspace directory prefixes.
 */
export function isSameFilePath(
  pathA: string,
  pathB: string,
  workspaceDir: string = "workspace"
): boolean {
  if (!pathA || !pathB) return false;
  const normA = normalizePath(pathA);
  const normB = normalizePath(pathB);
  if (normA === normB) return true;

  const strippedA = stripWorkspacePrefix(normA, workspaceDir);
  const strippedB = stripWorkspacePrefix(normB, workspaceDir);
  return strippedA === strippedB;
}

/**
 * Finds matching mock storage key if present
 */
function findMockStorageKey(
  path: string,
  workspaceDir: string = "workspace"
): string | null {
  const normPath = normalizePath(path);
  if (mockStorage.has(normPath)) return normPath;
  if (mockStorage.has(path)) return path;

  for (const key of mockStorage.keys()) {
    if (isSameFilePath(key, path, workspaceDir)) {
      return key;
    }
  }
  return null;
}

/**
 * Check if running inside a Tauri application environment
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Resolves the absolute workspace directory path.
 * In Tauri, this returns %APPDATA%/com.user.vault-app/workspace/.
 * In browser/test environments, falls back to "workspace".
 */
export async function getWorkspaceDir(): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<string>("get_workspace_dir");
    } catch (error) {
      console.warn("Failed to get workspace dir from Tauri:", error);
    }
  }
  return "workspace";
}

/**
 * Reads markdown text content from the specified file path.
 */
export async function readMarkdownFile(
  path: string,
  workspaceDir: string = "workspace"
): Promise<string> {
  const normPath = normalizePath(path);
  if (isTauriEnvironment()) {
    try {
      return await invoke<string>("read_file", { path: normPath });
    } catch (error) {
      if (
        !normPath.startsWith(workspaceDir + "/") &&
        !normPath.startsWith("workspace/")
      ) {
        try {
          return await invoke<string>("read_file", {
            path: `${workspaceDir}/${normPath}`,
          });
        } catch {
          // ignore fallback failure
        }
      }
      console.warn(
        "Tauri invoke read_file failed, falling back to mock storage:",
        error
      );
    }
  }

  const existingKey = findMockStorageKey(path, workspaceDir);
  if (existingKey) {
    return mockStorage.get(existingKey)!;
  }

  // Return empty default document if path not in mock storage
  return `# New Note (${path})\n\nStart typing your note here...\n`;
}

/**
 * Writes markdown text content to the specified file path.
 */
export async function writeMarkdownFile(
  path: string,
  content: string,
  workspaceDir: string = "workspace"
): Promise<void> {
  const normPath = normalizePath(path);
  if (isTauriEnvironment()) {
    try {
      await invoke("write_file", { path: normPath, content });
      const targetKey = findMockStorageKey(path, workspaceDir) || normPath;
      mockStorage.set(targetKey, content);
      notifyWorkspaceChange();
      return;
    } catch (error) {
      console.warn(
        "Tauri invoke write_file failed, persisting to mock storage:",
        error
      );
    }
  }

  const targetKey = findMockStorageKey(path, workspaceDir) || normPath;
  mockStorage.set(targetKey, content);
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

export interface ImportFolderOptions {
  sourcePath?: string;
  mockFiles?: Array<{ path: string; content: string }>;
}

/**
 * Import a folder into the workspace root.
 * Automatically converts any .txt files into .md format.
 */
export async function importFolder(
  options?: string | ImportFolderOptions
): Promise<{ success: boolean; importedPath?: string; count?: number }> {
  const sourcePath =
    typeof options === "string" ? options : options?.sourcePath;
  const mockFiles =
    typeof options === "object" ? options?.mockFiles : undefined;

  if (isTauriEnvironment()) {
    try {
      const workspaceDir = await getWorkspaceDir();
      const count = await invoke<number>("import_folder", {
        sourcePath: sourcePath || null,
        targetWorkspaceDir: workspaceDir,
      });
      notifyWorkspaceChange();
      return { success: true, count };
    } catch (error) {
      console.warn("Failed to import folder via Tauri command:", error);
    }
  }

  // Browser / mock fallback for testing
  if (mockFiles && mockFiles.length > 0) {
    let count = 0;
    for (const file of mockFiles) {
      const normPath = normalizePath(file.path);
      const convertedPath = normPath.replace(/\.txt$/i, ".md");
      mockStorage.set(convertedPath, file.content);
      count++;
    }
    notifyWorkspaceChange();
    return { success: true, count };
  } else if (sourcePath) {
    const folderName =
      normalizePath(sourcePath).split("/").pop() || "imported_folder";
    const defaultNotePath = `${folderName}/imported_note.md`;
    mockStorage.set(
      defaultNotePath,
      "# Imported Folder\n\nContent imported successfully."
    );
    notifyWorkspaceChange();
    return { success: true, count: 1, importedPath: folderName };
  }

  return { success: false, count: 0 };
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
  saveMockStorageToLocalStorage();
  workspaceListeners.forEach((listener) => listener());
}

/**
 * Helper to set initial or mock content in memory (useful for tests)
 */
export function setMockFileContent(
  path: string,
  content: string,
  workspaceDir: string = "workspace"
): void {
  const existingKey = findMockStorageKey(path, workspaceDir);
  const normPath = normalizePath(path);
  mockStorage.set(existingKey || normPath, content);
  notifyWorkspaceChange();
}

/**
 * Helper to get mock content from memory (useful for tests)
 */
export function getMockFileContent(
  path: string,
  workspaceDir: string = "workspace"
): string | undefined {
  const key = findMockStorageKey(path, workspaceDir);
  return key ? mockStorage.get(key) : undefined;
}

/**
 * Helper to clear mock storage (useful for resetting tests)
 */
export function clearMockStorage(): void {
  mockStorage.clear();
  mockStorageFolders.clear();
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_FILES_KEY);
      window.localStorage.removeItem(STORAGE_FOLDERS_KEY);
    } catch {
      // ignore
    }
  }
  notifyWorkspaceChange();
}

/**
 * Imports an external folder and its files into the workspace.
 * Converts any .txt files into .md files automatically.
 */
export async function importFolderFiles(
  files: { path: string; content: string }[] | FileList
): Promise<string[]> {
  const importedPaths: string[] = [];

  if (typeof FileList !== "undefined" && files instanceof FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let relPath = file.webkitRelativePath || file.name;
      if (!relPath) continue;

      relPath = normalizePath(relPath);

      if (relPath.toLowerCase().endsWith(".txt")) {
        relPath = relPath.slice(0, -4) + ".md";
      }

      const content = await file.text();
      await writeMarkdownFile(relPath, content);
      importedPaths.push(relPath);
    }
  } else if (Array.isArray(files)) {
    for (const item of files) {
      let relPath = normalizePath(item.path);
      if (relPath.toLowerCase().endsWith(".txt")) {
        relPath = relPath.slice(0, -4) + ".md";
      }
      await writeMarkdownFile(relPath, item.content);
      importedPaths.push(relPath);
    }
  }

  notifyWorkspaceChange();
  return importedPaths;
}
