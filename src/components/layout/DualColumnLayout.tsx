import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TaskDashboardSidebar,
  TaskItem,
  TaskState,
} from "../sidebar/TaskDashboardSidebar";
import { EditorPane } from "../editor/EditorPane";
import { DashboardView } from "../dashboard/DashboardView";
import { TitleBar } from "./TitleBar";
import { QuickSwitcher } from "../ui/QuickSwitcher";
import {
  readWorkspaceFiles,
  subscribeToWorkspaceChanges,
  writeMarkdownFile,
  readMarkdownFile,
  createFile,
  normalizePath,
  isSameFilePath,
  WorkspaceFile,
} from "../../services/fileService";
import {
  parseTasksFromMarkdown,
  toggleTaskInMarkdown,
  removeTaskFromMarkdown,
  appendTaskToMarkdown,
} from "../../services/workspaceService";
import {
  getThemeMode,
  toggleThemeMode,
  applyThemeMode,
  initTheme,
  subscribeTheme,
  getLiveBackground,
  getLiveBackgroundScope,
  getLiveBackgroundOpacity,
  getLiveBackgroundBlur,
  ThemeMode,
  LiveBackgroundScope,
} from "../../services/themeService";
import { SettingsModal } from "../settings/SettingsModal";
import { useGlobalShortcuts } from "../../hooks/useGlobalShortcuts";

export interface DualColumnLayoutProps {
  workspaceDir?: string;
}

export const DualColumnLayout: React.FC<DualColumnLayoutProps> = ({
  workspaceDir = "workspace",
}) => {
  const [activeFilename, setActiveFilename] = useState<string>("");
  const [activeEditorTasks, setActiveEditorTasks] = useState<TaskItem[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskState | "all">("all");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] =
    useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    getThemeMode()
  );
  const [liveBg, setLiveBg] = useState<string | null>(() =>
    getLiveBackground()
  );
  const [bgScope, setBgScope] = useState<LiveBackgroundScope>(() =>
    getLiveBackgroundScope()
  );
  const [bgOpacity, setBgOpacity] = useState<number>(() =>
    getLiveBackgroundOpacity()
  );
  const [bgBlur, setBgBlur] = useState<number>(() => getLiveBackgroundBlur());

  // Split View Dual-Pane State
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [activePane, setActivePane] = useState<"left" | "right">("left");
  const [rightFilename, setRightFilename] = useState<string>("");
  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const [isDraggingDivider, setIsDraggingDivider] = useState<boolean>(false);
  const [rightEditorTasks, setRightEditorTasks] = useState<TaskItem[]>([]);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleTaskFnRef = useRef<((nodeKey: string) => void) | null>(null);
  const removeTaskFnRef = useRef<((taskTitle: string) => boolean) | null>(null);

  useEffect(() => {
    initTheme();
    const unsub = subscribeTheme(() => {
      setThemeModeState(getThemeMode());
      setLiveBg(getLiveBackground());
      setBgScope(getLiveBackgroundScope());
      setBgOpacity(getLiveBackgroundOpacity());
      setBgBlur(getLiveBackgroundBlur());
    });
    return unsub;
  }, []);

  const handleSelectTag = useCallback((tag: string) => {
    setActiveTagFilter(tag);
  }, []);

  const handleClearTagFilter = useCallback(() => {
    setActiveTagFilter(null);
  }, []);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  const handleToggleThemeMode = useCallback(() => {
    const next = toggleThemeMode();
    setThemeModeState(next);
  }, []);

  const loadWorkspaceFiles = useCallback(async () => {
    try {
      const files = await readWorkspaceFiles(workspaceDir);
      setWorkspaceFiles(files);
    } catch (err) {
      console.warn("Failed to load workspace files:", err);
    }
  }, [workspaceDir]);

  useEffect(() => {
    loadWorkspaceFiles();
    const unsubscribe = subscribeToWorkspaceChanges(() => {
      loadWorkspaceFiles();
    });
    return () => {
      unsubscribe();
    };
  }, [loadWorkspaceFiles]);

  // Auto-select: pick first file when active file is missing (initial load or after deletion)
  useEffect(() => {
    if (workspaceFiles.length === 0) return;
    setActiveFilename((prev) => {
      if (!prev) return workspaceFiles[0].path;
      const exists = workspaceFiles.some(
        (f) => isSameFilePath(f.path, prev, workspaceDir) || f.name === prev
      );
      if (!exists) return workspaceFiles[0].path;
      return prev;
    });
  }, [workspaceFiles]);

  const handleRegisterToggleTask = useCallback(
    (toggleFn: (nodeKey: string) => void) => {
      toggleTaskFnRef.current = toggleFn;
    },
    []
  );

  const handleRegisterRemoveTask = useCallback(
    (removeFn: (taskTitle: string) => boolean) => {
      removeTaskFnRef.current = removeFn;
    },
    []
  );

  const handleSelectFile = useCallback(
    (path: string) => {
      if (isSplitView && activePane === "right") {
        setRightEditorTasks([]);
        setRightFilename(path);
      } else {
        setActiveEditorTasks([]);
        setActiveFilename(path);
      }
    },
    [isSplitView, activePane]
  );

  const handleToggleSplitView = useCallback(() => {
    setIsSplitView((prev) => {
      if (!prev) {
        setRightFilename((currRight) => {
          if (currRight && currRight !== activeFilename) return currRight;
          const other = workspaceFiles.find(
            (f) =>
              !isSameFilePath(f.path, activeFilename, workspaceDir) &&
              f.name !== activeFilename
          );
          return other ? other.path : activeFilename;
        });
        setActivePane("right");
        return true;
      } else {
        setActivePane("left");
        return false;
      }
    });
  }, [activeFilename, workspaceFiles, workspaceDir]);

  const handleOpenInSplitView = useCallback((path: string) => {
    setRightFilename(path);
    setIsSplitView(true);
    setActivePane("right");
  }, []);

  const handleCloseSplitPane = useCallback(() => {
    setIsSplitView(false);
    setActivePane("left");
  }, []);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  }, []);

  useEffect(() => {
    if (!isDraggingDivider) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      const clamped = Math.max(0.2, Math.min(0.8, newRatio));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingDivider]);

  const handleCreateNewNote = useCallback(async () => {
    try {
      const defaultDir = workspaceDir || "workspace";
      let targetFolder = defaultDir;

      if (activeFilename) {
        const norm = normalizePath(activeFilename);
        const lastSlash = norm.lastIndexOf("/");
        if (lastSlash !== -1) {
          targetFolder = norm.substring(0, lastSlash);
        }
      }

      let noteIndex = 0;
      let candidateName = "Untitled.md";
      let candidateFullPath = `${targetFolder}/${candidateName}`;

      const fileExists = (filePath: string) => {
        return workspaceFiles.some(
          (f) =>
            isSameFilePath(f.path, filePath, workspaceDir) ||
            f.name === candidateName ||
            normalizePath(f.path) === normalizePath(filePath)
        );
      };

      while (fileExists(candidateFullPath)) {
        noteIndex++;
        candidateName = `Untitled ${noteIndex}.md`;
        candidateFullPath = `${targetFolder}/${candidateName}`;
      }

      const title = candidateName.replace(/\.md$/, "");
      const initialContent = `# ${title}\n\n`;

      await createFile(candidateFullPath, initialContent);
      await loadWorkspaceFiles();
      setActiveFilename(candidateFullPath);
      setActiveEditorTasks([]);
    } catch (err) {
      console.error("Failed to create new note via shortcut:", err);
    }
  }, [activeFilename, workspaceDir, workspaceFiles, loadWorkspaceFiles]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+P / Cmd+P -> Toggle Quick Switcher
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "p"
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickSwitcherOpen((prev) => !prev);
        return;
      }

      // 2. Ctrl+N / Cmd+N -> Create New Note in active folder
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleCreateNewNote();
        return;
      }

      // 3. Ctrl+\ / Cmd+\ -> Toggle Split View
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.altKey &&
        !e.shiftKey &&
        (e.key === "\\" || e.key === "|")
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleToggleSplitView();
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [handleCreateNewNote, handleToggleSplitView]);

  // System-wide Global OS Shortcuts (Ctrl+Alt+N / Cmd+Option+N and Ctrl+Alt+P / Cmd+Option+P)
  useGlobalShortcuts({
    onNewNote: handleCreateNewNote,
    onOpenQuickSwitcher: () => setIsQuickSwitcherOpen(true),
  });

  // Determine if active file is a Dashboard
  const normActivePath = normalizePath(activeFilename);
  const activeFileObj = workspaceFiles.find(
    (f) =>
      isSameFilePath(f.path, activeFilename, workspaceDir) ||
      f.name === activeFilename
  );
  const isDashboardFile =
    normActivePath.endsWith(".dashboard.md") ||
    (activeFileObj &&
      Boolean(
        activeFileObj.content
          .match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
          .includes("type: dashboard")
      ));

  // Aggregate tasks from all non-dashboard workspace files
  const aggregatedTasks: TaskItem[] = [];

  workspaceFiles.forEach((file) => {
    const normP = normalizePath(file.path);
    const isThisActiveFile =
      isSameFilePath(file.path, activeFilename, workspaceDir) ||
      file.name === activeFilename;
    if (
      !isThisActiveFile &&
      !normP.endsWith(".dashboard.md") &&
      !file.content
        .match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
        .includes("type: dashboard")
    ) {
      const fileTasks = parseTasksFromMarkdown(file.content, file.path);
      aggregatedTasks.push(...fileTasks);
    }
  });

  // Add tasks from active document if it's not a dashboard
  if (!isDashboardFile) {
    const isEditorTasksMatchingActive =
      activeEditorTasks.length > 0 &&
      activeEditorTasks.every((t) => {
        const activeBaseName = activeFilename.split(/[/\\]/).pop();
        return (
          isSameFilePath(t.sourceFile, activeFilename, workspaceDir) ||
          t.sourceFile === activeBaseName ||
          normalizePath(t.sourceFile) === normActivePath
        );
      });

    if (isEditorTasksMatchingActive) {
      aggregatedTasks.push(...activeEditorTasks);
    } else if (activeFileObj) {
      aggregatedTasks.push(
        ...parseTasksFromMarkdown(activeFileObj.content, activeFileObj.path)
      );
    }

    if (isSplitView && rightEditorTasks.length > 0) {
      aggregatedTasks.push(...rightEditorTasks);
    }
  }

  // Filter tasks for the currently active open Note
  const activeFileTasks = activeFilename
    ? aggregatedTasks.filter((task) => {
        const activeBaseName = activeFilename.split(/[/\\]/).pop();
        return (
          isSameFilePath(task.sourceFile, activeFilename, workspaceDir) ||
          task.sourceFile === activeBaseName ||
          normalizePath(task.sourceFile) === normActivePath
        );
      })
    : [];

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      const targetTask = aggregatedTasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const activeBaseName = activeFilename.split(/[/\\]/).pop();
      const isActiveFile =
        isSameFilePath(targetTask.sourceFile, activeFilename, workspaceDir) ||
        targetTask.sourceFile === activeBaseName ||
        normalizePath(targetTask.sourceFile) === normActivePath;

      if (isActiveFile && !isDashboardFile && removeTaskFnRef.current) {
        removeTaskFnRef.current(targetTask.title);
      } else {
        const fileToUpdate = workspaceFiles.find(
          (f) =>
            isSameFilePath(f.path, targetTask.sourceFile, workspaceDir) ||
            f.name === targetTask.sourceFile
        );
        const currentContent = fileToUpdate
          ? fileToUpdate.content
          : await readMarkdownFile(targetTask.sourceFile);

        const { updatedContent } = removeTaskFromMarkdown(
          currentContent,
          targetTask.title
        );

        await writeMarkdownFile(targetTask.sourceFile, updatedContent);
        await loadWorkspaceFiles();
      }
    },
    [
      aggregatedTasks,
      activeFilename,
      normActivePath,
      isDashboardFile,
      workspaceFiles,
      loadWorkspaceFiles,
    ]
  );

  const handleToggleTask = useCallback(
    async (taskId: string) => {
      const targetTask = aggregatedTasks.find((t) => t.id === taskId);
      if (!targetTask) {
        if (toggleTaskFnRef.current) {
          toggleTaskFnRef.current(taskId);
        }
        return;
      }

      const activeBaseName = activeFilename.split(/[/\\]/).pop();
      const isActiveFile =
        isSameFilePath(targetTask.sourceFile, activeFilename, workspaceDir) ||
        targetTask.sourceFile === activeBaseName;

      if (isActiveFile && !isDashboardFile) {
        const activeTask = activeEditorTasks.find(
          (t) => t.title === targetTask.title
        );

        const nodeKeyToToggle = activeTask?.nodeKey || targetTask.nodeKey;
        if (toggleTaskFnRef.current && nodeKeyToToggle) {
          toggleTaskFnRef.current(nodeKeyToToggle);
        }
      } else {
        const fileToUpdate = workspaceFiles.find(
          (f) =>
            isSameFilePath(f.path, targetTask.sourceFile, workspaceDir) ||
            f.name === targetTask.sourceFile
        );
        const currentContent = fileToUpdate
          ? fileToUpdate.content
          : await readMarkdownFile(targetTask.sourceFile);

        const updatedContent = toggleTaskInMarkdown(
          currentContent,
          targetTask.title
        );

        await writeMarkdownFile(targetTask.sourceFile, updatedContent);
        loadWorkspaceFiles();
      }
    },
    [
      activeEditorTasks,
      aggregatedTasks,
      activeFilename,
      isDashboardFile,
      workspaceFiles,
      loadWorkspaceFiles,
    ]
  );

  const handleMoveTaskToNote = useCallback(
    async (
      taskTitle: string,
      sourceFile: string,
      targetNotePath: string,
      priority?: string
    ) => {
      try {
        const rawSource = sourceFile || activeFilename;

        const sourceFileObj = workspaceFiles.find(
          (f) =>
            isSameFilePath(f.path, rawSource, workspaceDir) ||
            f.name === rawSource
        );
        const targetFileObj = workspaceFiles.find(
          (f) =>
            isSameFilePath(f.path, targetNotePath, workspaceDir) ||
            f.name === targetNotePath
        );

        const resolvedSourcePath = sourceFileObj
          ? sourceFileObj.path
          : rawSource;
        const resolvedTargetPath = targetFileObj
          ? targetFileObj.path
          : targetNotePath;

        if (
          isSameFilePath(resolvedSourcePath, resolvedTargetPath, workspaceDir)
        ) {
          return;
        }

        const isActiveSource =
          isSameFilePath(resolvedSourcePath, activeFilename, workspaceDir) ||
          sourceFileObj?.name === activeFilename;

        let removedTaskLine: string | null = null;

        if (isActiveSource && !isDashboardFile && removeTaskFnRef.current) {
          const removed = removeTaskFnRef.current(taskTitle);
          if (removed) {
            const activeContent = sourceFileObj ? sourceFileObj.content : "";
            const match = activeContent.split(/\r?\n/).find((line) => {
              const m = line.match(/^(\s*[-*+]\s+)?\[([ x\->X])\]\s*(.*)$/);
              return (
                m &&
                (m[3].trim() === taskTitle || taskTitle.includes(m[3].trim()))
              );
            });
            removedTaskLine = match || `- [ ] ${taskTitle}`;
          }
        }

        const sourceContent = sourceFileObj
          ? sourceFileObj.content
          : await readMarkdownFile(resolvedSourcePath);

        const { updatedContent: newSourceContent, removedTaskLine: taskLine } =
          removeTaskFromMarkdown(sourceContent, taskTitle);

        await writeMarkdownFile(resolvedSourcePath, newSourceContent);
        if (!removedTaskLine) {
          removedTaskLine = taskLine;
        }

        const targetContent = targetFileObj
          ? targetFileObj.content
          : await readMarkdownFile(resolvedTargetPath);

        const newTargetContent = appendTaskToMarkdown(
          targetContent,
          removedTaskLine || `- [ ] ${taskTitle}`,
          priority
        );

        await writeMarkdownFile(resolvedTargetPath, newTargetContent);

        await loadWorkspaceFiles();
      } catch (err) {
        console.error("Failed to move task to note:", err);
      }
    },
    [
      activeFilename,
      workspaceFiles,
      isDashboardFile,
      loadWorkspaceFiles,
      workspaceDir,
    ]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--rose-bg-base)",
      }}
    >
      <TitleBar
        activeFilename={activeFilename}
        workspaceDir={workspaceDir}
        themeMode={themeMode}
        onToggleThemeMode={handleToggleThemeMode}
        onOpenQuickSwitcher={() => setIsQuickSwitcherOpen(true)}
      />
      <div
        style={{
          display: "flex",
          flex: 1,
          width: "100%",
          height: "calc(100vh - 36px)",
          overflow: "hidden",
        }}
      >
        <TaskDashboardSidebar
          tasks={aggregatedTasks}
          activeFileTasks={activeFileTasks}
          activeFilter={activeFilter}
          activeTagFilter={activeTagFilter}
          onFilterChange={setActiveFilter}
          onClearTagFilter={handleClearTagFilter}
          onSelectTag={handleSelectTag}
          onToggleTask={handleToggleTask}
          activeFilePath={
            isSplitView && activePane === "right"
              ? rightFilename
              : activeFilename
          }
          onSelectFile={handleSelectFile}
          workspaceDir={workspaceDir}
          onMoveTaskToNote={handleMoveTaskToNote}
          onDeleteTask={handleDeleteTask}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenInSplitView={handleOpenInSplitView}
        />
        <div
          ref={splitContainerRef}
          data-testid="dual-column-editor-container"
          style={{
            display: "flex",
            flex: 1,
            height: "100%",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Left / Primary Pane */}
          <div
            data-testid="split-view-left-pane"
            onClick={() => setActivePane("left")}
            style={{
              flex: isSplitView ? `0 0 calc(${splitRatio * 100}% - 4px)` : 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              position: "relative",
              borderTop:
                isSplitView && activePane === "left"
                  ? "2px solid var(--rose-pink)"
                  : "2px solid transparent",
              boxShadow:
                isSplitView && activePane === "left"
                  ? "inset 0 2px 8px rgba(235, 111, 146, 0.12)"
                  : "none",
              transition: "border-color 150ms ease, box-shadow 150ms ease",
              zIndex: isSplitView && activePane === "left" ? 2 : 1,
            }}
          >
            {activeFilename ? (
              isDashboardFile ? (
                <DashboardView
                  key={activeFilename}
                  filePath={activeFilename}
                  workspaceFiles={workspaceFiles}
                  activeTagFilter={activeTagFilter}
                  onClearTagFilter={handleClearTagFilter}
                  onSelectTag={handleSelectTag}
                  onSelectFile={handleSelectFile}
                  onRefreshWorkspace={loadWorkspaceFiles}
                  onTasksChange={setActiveEditorTasks}
                  onRegisterToggleTask={handleRegisterToggleTask}
                />
              ) : (
                <EditorPane
                  key={activeFilename}
                  filename={activeFilename}
                  workspaceDir={workspaceDir}
                  onTasksChange={setActiveEditorTasks}
                  onRegisterToggleTask={handleRegisterToggleTask}
                  onRegisterRemoveTask={handleRegisterRemoveTask}
                  onSelectTag={handleSelectTag}
                  onToggleSplitView={handleToggleSplitView}
                  isSplitView={isSplitView}
                />
              )
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--rose-subtle)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                }}
              >
                No file selected
              </div>
            )}
          </div>

          {/* Draggable Divider & Right Pane when in Split View */}
          {isSplitView && (
            <>
              <div
                data-testid="split-view-divider"
                className="split-view-divider"
                onMouseDown={handleDividerMouseDown}
                style={{
                  width: "8px",
                  cursor: "col-resize",
                  backgroundColor: isDraggingDivider
                    ? "var(--rose-bg-overlay)"
                    : "var(--rose-bg-surface)",
                  borderLeft: "1px solid var(--rose-border-color)",
                  borderRight: "1px solid var(--rose-border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 10,
                  userSelect: "none",
                  boxShadow: isDraggingDivider
                    ? "0 0 10px rgba(235, 111, 146, 0.35)"
                    : "none",
                  transition:
                    "background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                }}
              >
                <div
                  data-testid="split-view-divider-grip"
                  className="split-view-divider-grip"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 1px",
                    borderRadius: "4px",
                    backgroundColor: isDraggingDivider
                      ? "rgba(235, 111, 146, 0.2)"
                      : "transparent",
                    transition: "all 150ms ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      lineHeight: "1",
                      color: isDraggingDivider
                        ? "var(--rose-pink)"
                        : "var(--rose-muted)",
                      userSelect: "none",
                      letterSpacing: "-1px",
                    }}
                  >
                    ⋮⋮
                  </span>
                </div>
              </div>
              <div
                data-testid="split-view-right-pane"
                onClick={() => setActivePane("right")}
                style={{
                  flex: `0 0 calc(${(1 - splitRatio) * 100}% - 4px)`,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden",
                  position: "relative",
                  borderTop:
                    activePane === "right"
                      ? "2px solid var(--rose-pink)"
                      : "2px solid transparent",
                  boxShadow:
                    activePane === "right"
                      ? "inset 0 2px 8px rgba(235, 111, 146, 0.12)"
                      : "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                  zIndex: activePane === "right" ? 2 : 1,
                }}
              >
                {rightFilename ? (
                  normalizePath(rightFilename).endsWith(".dashboard.md") ? (
                    <DashboardView
                      key={rightFilename}
                      filePath={rightFilename}
                      workspaceFiles={workspaceFiles}
                      activeTagFilter={activeTagFilter}
                      onClearTagFilter={handleClearTagFilter}
                      onSelectTag={handleSelectTag}
                      onSelectFile={handleSelectFile}
                      onRefreshWorkspace={loadWorkspaceFiles}
                      onTasksChange={setRightEditorTasks}
                    />
                  ) : (
                    <EditorPane
                      key={rightFilename}
                      filename={rightFilename}
                      workspaceDir={workspaceDir}
                      onTasksChange={setRightEditorTasks}
                      onSelectTag={handleSelectTag}
                      onToggleSplitView={handleToggleSplitView}
                      isSplitView={true}
                      onCloseSplitPane={handleCloseSplitPane}
                    />
                  )
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--rose-subtle)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                    }}
                  >
                    No file selected in split view
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Background Backdrop (Full App Scope) */}
      {liveBg && bgScope === "full" && (
        <div
          data-testid="live-bg-backdrop"
          className="live-bg-container"
          style={{
            backgroundImage: `url("${liveBg}")`,
            opacity: bgOpacity,
            filter: bgBlur > 0 ? `blur(${bgBlur}px)` : "none",
          }}
        />
      )}

      {/* Modals */}
      <QuickSwitcher
        isOpen={isQuickSwitcherOpen}
        notes={workspaceFiles}
        activeFilePath={activeFilename}
        workspaceDir={workspaceDir}
        onSelectNote={handleSelectFile}
        onClose={() => setIsQuickSwitcherOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default DualColumnLayout;
