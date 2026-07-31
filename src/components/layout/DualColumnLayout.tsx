import React, { useState, useRef, useCallback } from "react";
import {
  TaskDashboardSidebar,
  TaskItem,
  TaskState,
} from "../sidebar/TaskDashboardSidebar";
import { EditorPane } from "../editor/EditorPane";

export interface DualColumnLayoutProps {
  filename?: string;
}

export const DualColumnLayout: React.FC<DualColumnLayoutProps> = ({
  filename = "workspace-note.md",
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskState | "all">("all");
  const toggleTaskFnRef = useRef<((nodeKey: string) => void) | null>(null);

  const handleRegisterToggleTask = useCallback(
    (toggleFn: (nodeKey: string) => void) => {
      toggleTaskFnRef.current = toggleFn;
    },
    []
  );

  const handleToggleTask = useCallback((taskId: string) => {
    if (toggleTaskFnRef.current) {
      toggleTaskFnRef.current(taskId);
    }
  }, []);

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
        tasks={tasks}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onToggleTask={handleToggleTask}
      />
      <EditorPane
        filename={filename}
        onTasksChange={setTasks}
        onRegisterToggleTask={handleRegisterToggleTask}
      />
    </div>
  );
};

export default DualColumnLayout;
