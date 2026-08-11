import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TaskDashboardSidebar,
  TaskItem,
  TaskState,
} from "../sidebar/TaskDashboardSidebar";
import { EditorPane } from "../editor/EditorPane";
import { DashboardView } from "../dashboard/DashboardView";
import {
  readWorkspaceFiles,
  subscribeToWorkspaceChanges,
  writeMarkdownFile,
  readMarkdownFile,
  normalizePath,
  WorkspaceFile,
} from "../../services/fileService";
import {
  parseTasksFromMarkdown,
  toggleTaskInMarkdown,
  removeTaskFromMarkdown,
  appendTaskToMarkdown,
} from "../../services/workspaceService";

export interface DualColumnLayoutProps {
  filename?: string;
  workspaceDir?: string;
}

export const DualColumnLayout: React.FC<DualColumnLayoutProps> = ({
  filename: initialFilename = "workspace-note.md",
  workspaceDir = "workspace",
}) => {
  const [activeFilename, setActiveFilename] = useState<string>(initialFilename);
  const [activeEditorTasks, setActiveEditorTasks] = useState<TaskItem[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskState | "all">("all");
  const toggleTaskFnRef = useRef<((nodeKey: string) => void) | null>(null);

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

  const handleRegisterToggleTask = useCallback(
    (toggleFn: (nodeKey: string) => void) => {
      toggleTaskFnRef.current = toggleFn;
    },
    []
  );

  // Determine if active file is a Dashboard
  const normActivePath = normalizePath(activeFilename);
  const activeFileObj = workspaceFiles.find(
    (f) => normalizePath(f.path) === normActivePath || f.name === activeFilename
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
    if (
      normP !== normActivePath &&
      !normP.endsWith(".dashboard.md") &&
      !file.content
        .match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
        .includes("type: dashboard")
    ) {
      const fileTasks = parseTasksFromMarkdown(file.content, file.name);
      aggregatedTasks.push(...fileTasks);
    }
  });

  // Add tasks from active document if it's not a dashboard
  if (!isDashboardFile) {
    if (activeEditorTasks.length > 0) {
      aggregatedTasks.push(...activeEditorTasks);
    } else if (activeFileObj) {
      aggregatedTasks.push(
        ...parseTasksFromMarkdown(activeFileObj.content, activeFileObj.name)
      );
    }
  }

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
        targetTask.sourceFile === activeFilename ||
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
            f.name === targetTask.sourceFile || f.path === targetTask.sourceFile
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
    async (taskTitle: string, sourceFile: string, targetNotePath: string) => {
      try {
        const sourceContent = await readMarkdownFile(sourceFile);
        const { updatedContent: newSourceContent, removedTaskLine } =
          removeTaskFromMarkdown(sourceContent, taskTitle);

        await writeMarkdownFile(sourceFile, newSourceContent);

        const targetContent = await readMarkdownFile(targetNotePath);
        const newTargetContent = appendTaskToMarkdown(
          targetContent,
          removedTaskLine || `- [ ] ${taskTitle}`
        );
        await writeMarkdownFile(targetNotePath, newTargetContent);

        loadWorkspaceFiles();
      } catch (err) {
        console.error("Failed to move task to note:", err);
      }
    },
    [loadWorkspaceFiles]
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--rose-bg-base)",
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
      />
      {isDashboardFile ? (
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
        />
      )}
    </div>
  );
};

export default DualColumnLayout;
