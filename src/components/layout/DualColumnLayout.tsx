import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TaskDashboardSidebar,
  TaskItem,
  TaskState,
} from "../sidebar/TaskDashboardSidebar";
import { EditorPane } from "../editor/EditorPane";
import { DashboardView } from "../dashboard/DashboardView";
import { TitleBar } from "./TitleBar";
import {
  readWorkspaceFiles,
  subscribeToWorkspaceChanges,
  writeMarkdownFile,
  readMarkdownFile,
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
  const toggleTaskFnRef = useRef<((nodeKey: string) => void) | null>(null);
  const removeTaskFnRef = useRef<((taskTitle: string) => boolean) | null>(null);

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
    if (activeEditorTasks.length > 0) {
      aggregatedTasks.push(...activeEditorTasks);
    } else if (activeFileObj) {
      aggregatedTasks.push(
        ...parseTasksFromMarkdown(activeFileObj.content, activeFileObj.path)
      );
    }
  }

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
      <TitleBar activeFilename={activeFilename} />
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
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onToggleTask={handleToggleTask}
          activeFilePath={activeFilename}
          onSelectFile={(path) => setActiveFilename(path)}
          workspaceDir={workspaceDir}
          onMoveTaskToNote={handleMoveTaskToNote}
          onDeleteTask={handleDeleteTask}
        />
        {activeFilename ? (
          isDashboardFile ? (
            <DashboardView
              key={activeFilename}
              filePath={activeFilename}
              workspaceFiles={workspaceFiles}
              onSelectFile={(path) => setActiveFilename(path)}
              onRefreshWorkspace={loadWorkspaceFiles}
              onTasksChange={setActiveEditorTasks}
              onRegisterToggleTask={handleRegisterToggleTask}
            />
          ) : (
            <EditorPane
              key={activeFilename}
              filename={activeFilename}
              onTasksChange={setActiveEditorTasks}
              onRegisterToggleTask={handleRegisterToggleTask}
              onRegisterRemoveTask={handleRegisterRemoveTask}
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
    </div>
  );
};

export default DualColumnLayout;
