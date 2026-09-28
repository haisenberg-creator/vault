import { TaskState } from "../components/sidebar/TaskDashboardSidebar";
import { isSameFilePath, normalizePath } from "./fileService";

export const SESSION_STORAGE_KEY = "vault_session_v2";
export const DEBOUNCE_DELAY_MS = 150;

export interface WorkspaceSessionState {
  activeFilename: string | null;
  isSplitView: boolean;
  rightFilename: string | null;
  splitRatio: number;
  isSidebarCollapsed: boolean;
  sidebarWidth: number;
  expandedPaths: string[];
  activeFilter: TaskState | "all";
  activeTagFilter: string | null;
}

export const DEFAULT_SESSION_STATE: WorkspaceSessionState = {
  activeFilename: null,
  isSplitView: false,
  rightFilename: null,
  splitRatio: 0.5,
  isSidebarCollapsed: false,
  sidebarWidth: 280,
  expandedPaths: [""],
  activeFilter: "all",
  activeTagFilter: null,
};

const VALID_TASK_STATES: ReadonlySet<string> = new Set([
  "all",
  "open",
  "in_progress",
  "blocked",
  "completed",
]);

/**
 * Validates and sanitizes an untrusted session state object against the schema.
 * Replaces missing or corrupted fields with sensible defaults.
 */
export function validateSessionState(raw: unknown): WorkspaceSessionState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_SESSION_STATE };
  }

  const obj = raw as Record<string, unknown>;

  const activeFilename =
    typeof obj.activeFilename === "string" ? obj.activeFilename : null;

  const isSplitView =
    typeof obj.isSplitView === "boolean" ? obj.isSplitView : false;

  const rightFilename =
    typeof obj.rightFilename === "string" ? obj.rightFilename : null;

  let splitRatio =
    typeof obj.splitRatio === "number" && !Number.isNaN(obj.splitRatio)
      ? obj.splitRatio
      : 0.5;
  splitRatio = Math.max(0.2, Math.min(0.8, splitRatio));

  const isSidebarCollapsed =
    typeof obj.isSidebarCollapsed === "boolean"
      ? obj.isSidebarCollapsed
      : false;

  let sidebarWidth =
    typeof obj.sidebarWidth === "number" && !Number.isNaN(obj.sidebarWidth)
      ? obj.sidebarWidth
      : 280;
  sidebarWidth = Math.max(180, Math.min(800, sidebarWidth));

  let expandedPaths: string[] = [""];
  if (
    Array.isArray(obj.expandedPaths) &&
    obj.expandedPaths.every((p) => typeof p === "string")
  ) {
    expandedPaths = obj.expandedPaths;
  }

  let activeFilter: TaskState | "all" = "all";
  if (
    typeof obj.activeFilter === "string" &&
    VALID_TASK_STATES.has(obj.activeFilter)
  ) {
    activeFilter = obj.activeFilter as TaskState | "all";
  }

  const activeTagFilter =
    typeof obj.activeTagFilter === "string" ? obj.activeTagFilter : null;

  return {
    activeFilename,
    isSplitView,
    rightFilename,
    splitRatio,
    isSidebarCollapsed,
    sidebarWidth,
    expandedPaths,
    activeFilter,
    activeTagFilter,
  };
}

/**
 * Loads the stored session from localStorage.
 * If nonexistent or corrupted, returns DEFAULT_SESSION_STATE.
 */
export function loadSession(): WorkspaceSessionState {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ...DEFAULT_SESSION_STATE };
    }
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SESSION_STATE };
    }
    const parsed = JSON.parse(raw);
    return validateSessionState(parsed);
  } catch (err) {
    console.warn("Failed to load session from localStorage:", err);
    return { ...DEFAULT_SESSION_STATE };
  }
}

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: WorkspaceSessionState | null = null;

/**
 * Persists the session state to localStorage with a 150ms debounce.
 * If immediate is true, persists synchronously.
 */
export function saveSession(
  stateUpdate: Partial<WorkspaceSessionState>,
  immediate = false
): void {
  const current = pendingState ?? loadSession();
  pendingState = { ...current, ...stateUpdate };

  if (immediate) {
    flushSession();
    return;
  }

  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }

  pendingTimer = setTimeout(() => {
    flushSession();
  }, DEBOUNCE_DELAY_MS);
}

/**
 * Flushes any pending debounced session save immediately to localStorage.
 */
export function flushSession(): void {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }

  if (!pendingState) {
    return;
  }

  const toPersist = validateSessionState(pendingState);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(toPersist)
      );
    }
  } catch (err) {
    console.warn("Failed to save session to localStorage:", err);
  }

  pendingState = null;
}

/**
 * Clears the stored session and cancels any pending debounced write.
 */
export function clearSession(): void {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  pendingState = null;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.warn("Failed to clear session from localStorage:", err);
  }
}

/**
 * Prunes session activeFilename and rightFilename against currently loaded workspace files.
 * If activeFilename was deleted, falls back to first available note or null.
 * If rightFilename was deleted, falls back to null.
 */
export function pruneSessionFiles(
  session: WorkspaceSessionState,
  validFilePaths: string[],
  workspaceDir = "workspace"
): WorkspaceSessionState {
  const fileExists = (filePath: string | null): boolean => {
    if (!filePath) return false;
    return validFilePaths.some((p) => {
      if (isSameFilePath(p, filePath, workspaceDir)) return true;
      const baseA = p.split(/[/\\]/).pop();
      const baseB = filePath.split(/[/\\]/).pop();
      if (baseA && baseB && baseA === baseB) return true;
      const normA = normalizePath(p);
      const normB = normalizePath(filePath);
      return (
        normA === normB ||
        normA.endsWith("/" + normB) ||
        normB.endsWith("/" + normA)
      );
    });
  };

  const hasActive = fileExists(session.activeFilename);
  const hasRight = fileExists(session.rightFilename);

  let newActive = session.activeFilename;
  let newRight = session.rightFilename;

  if (!hasActive) {
    newActive = validFilePaths.length > 0 ? validFilePaths[0] : null;
  }

  if (!hasRight) {
    newRight = null;
  }

  return {
    ...session,
    activeFilename: newActive,
    rightFilename: newRight,
  };
}
