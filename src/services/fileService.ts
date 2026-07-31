import { invoke } from "@tauri-apps/api/core";

export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
}

type WorkspaceChangeListener = () => void;
const workspaceListeners: Set<WorkspaceChangeListener> = new Set();

// In-memory mock storage for browser testing / non-Tauri execution
const mockStorage: Map<string, string> = new Map([
  [
    "workspace-note.md",
    `# Workspace Project Roadmap

Welcome to the Rosé Pine Moon Soho Checklist app. Tasks within plain Markdown files are automatically aggregated into the Task Dashboard on the left sidebar.

## Immediate Milestones

- [x] Set up Dual Column layout shell with Rosé Pine tokens
- [-] Integrate Tauri file system commands for reading/writing markdown
- [ ] Lexical editor Markdown transformer & DecoratorNode integration
- [>] Custom interactive checklist portal node renderer
`,
  ],
]);

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
  if (isTauriEnvironment()) {
    try {
      return await invoke<string>("read_file", { path });
    } catch (error) {
      console.warn(
        "Tauri invoke read_file failed, falling back to mock storage:",
        error
      );
    }
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
  if (isTauriEnvironment()) {
    try {
      await invoke("write_file", { path, content });
      mockStorage.set(path, content);
      notifyWorkspaceChange();
      return;
    } catch (error) {
      console.warn(
        "Tauri invoke write_file failed, persisting to mock storage:",
        error
      );
    }
  }

  mockStorage.set(path, content);
  notifyWorkspaceChange();
}

/**
 * Reads all .md files in the specified target workspace folder.
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
    if (path.endsWith(".md")) {
      const name =
        path.includes("/") || path.includes("\\")
          ? path.split(/[/\\]/).pop() || path
          : path;
      result.push({ path, name, content });
    }
  });
  return result;
}

/**
 * Subscribe to workspace file updates (e.g. when files are modified)
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
  mockStorage.set(path, content);
  notifyWorkspaceChange();
}

/**
 * Helper to get mock content from memory (useful for tests)
 */
export function getMockFileContent(path: string): string | undefined {
  return mockStorage.get(path);
}

/**
 * Helper to clear mock storage (useful for resetting tests)
 */
export function clearMockStorage(): void {
  mockStorage.clear();
  notifyWorkspaceChange();
}
