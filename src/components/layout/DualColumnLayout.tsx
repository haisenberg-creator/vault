import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TaskDashboardSidebar,
  TaskItem,
  TaskState,
} from "../sidebar/TaskDashboardSidebar";
import { EditorPane } from "../editor/EditorPane";
import {
  readWorkspaceFiles,
  subscribeToWorkspaceChanges,
  writeMarkdownFile,
  readMarkdownFile,
  WorkspaceFile,
} from "../../services/fileService";
import {
  parseTasksFromMarkdown,
  toggleTaskInMarkdown,
} from "../../services/workspaceService";

export interface DualColumnLayoutProps {
  filename?: string;
  workspaceDir?: string;
}

export const DualColumnLayout: React.FC<DualColumnLayoutProps> = ({
  filename = "workspace-note.md",
  workspaceDir = "workspace",
}) => {
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

  // Aggregate tasks from all workspace files
  const aggregatedTasks: TaskItem[] = [];

  // Add tasks from non-active workspace files
  workspaceFiles.forEach((file) => {
    if (file.name !== filename && file.path !== filename) {
      const fileTasks = parseTasksFromMarkdown(file.content, file.name);
      aggregatedTasks.push(...fileTasks);
    }
  });

  // Add tasks from active document
  if (activeEditorTasks.length > 0) {
    aggregatedTasks.push(...activeEditorTasks);
  } else {
    // Fallback parsing from workspace files if active editor hasn't loaded nodes yet
    const activeFile = workspaceFiles.find(
      (f) => f.name === filename || f.path === filename
    );
    if (activeFile) {
      aggregatedTasks.push(
        ...parseTasksFromMarkdown(activeFile.content, activeFile.name)
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

      const activeBaseName = filename.split(/[/\\]/).pop();
      const isActiveFile =
        targetTask.sourceFile === filename ||
        targetTask.sourceFile === activeBaseName;

      if (isActiveFile) {
        // Find current matching task in activeEditorTasks by title
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
      }
    },
    [activeEditorTasks, aggregatedTasks, filename, workspaceFiles]
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
      />
      <EditorPane
        filename={filename}
        onTasksChange={setActiveEditorTasks}
        onRegisterToggleTask={handleRegisterToggleTask}
      />
    </div>
  );
};

export default DualColumnLayout;
