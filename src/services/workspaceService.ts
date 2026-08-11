import {
  TaskItem,
  TaskState,
} from "../components/sidebar/TaskDashboardSidebar";
import { getNextTaskState } from "../components/editor/ChecklistNode";

/**
 * Interface representing a workspace file entry
 */
export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
}

/**
 * Parses all stateful checklist task items from raw markdown content.
 * Syntax recognized:
 * - [ ] Task (open)
 * - [-] Task (in_progress)
 * - [>] Task (blocked)
 * - [x] or [X] Task (completed)
 */
export function parseTasksFromMarkdown(
  content: string,
  sourceFile: string
): TaskItem[] {
  const tasks: TaskItem[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = line.match(/^(\s*[-*+]\s+)?\[([ x\->X])\]\s*(.*)$/);
    if (match) {
      const flag = match[2];
      const title = match[3].trim() || "Untitled Task";

      let state: TaskState = "open";
      if (flag === "x" || flag === "X") {
        state = "completed";
      } else if (flag === "-") {
        state = "in_progress";
      } else if (flag === ">") {
        state = "blocked";
      }

      tasks.push({
        id: `${sourceFile}:${index}:${title}`,
        nodeKey: `${sourceFile}:${index}`,
        title,
        sourceFile,
        state,
      });
    }
  });

  return tasks;
}

/**
 * Toggles a specific task's state within raw markdown string.
 */
export function toggleTaskInMarkdown(
  content: string,
  taskTitle: string,
  targetState?: TaskState
): string {
  const lines = content.split(/\r?\n/);

  const updatedLines = lines.map((line) => {
    const match = line.match(/^(\s*[-*+]\s+)?\[([ x\->X])\]\s*(.*)$/);
    if (match) {
      const prefix = match[1] || "- ";
      const currentFlag = match[2];
      const title = match[3].trim();

      if (title === taskTitle || taskTitle.includes(title)) {
        let currentState: TaskState = "open";
        if (currentFlag === "x" || currentFlag === "X")
          currentState = "completed";
        else if (currentFlag === "-") currentState = "in_progress";
        else if (currentFlag === ">") currentState = "blocked";

        const newState = targetState ?? getNextTaskState(currentState);

        let newFlag = " ";
        if (newState === "completed") newFlag = "x";
        else if (newState === "in_progress") newFlag = "-";
        else if (newState === "blocked") newFlag = ">";

        return `${prefix}[${newFlag}] ${title}`;
      }
    }
    return line;
  });

  return updatedLines.join("\n");
}

/**
 * Removes a task line matching taskTitle from raw markdown content.
 */
export function removeTaskFromMarkdown(
  content: string,
  taskTitle: string
): { updatedContent: string; removedTaskLine: string | null } {
  const lines = content.split(/\r?\n/);
  let removedTaskLine: string | null = null;

  const updatedLines = lines.filter((line) => {
    if (!removedTaskLine) {
      const match = line.match(/^(\s*[-*+]\s+)?\[([ x\->X])\]\s*(.*)$/);
      if (match) {
        const title = match[3].trim();
        if (title === taskTitle || taskTitle.includes(title)) {
          removedTaskLine = line;
          return false;
        }
      }
    }
    return true;
  });

  return {
    updatedContent: updatedLines.join("\n"),
    removedTaskLine: removedTaskLine || `- [ ] ${taskTitle}`,
  };
}

/**
 * Appends a task line to target markdown content.
 */
export function appendTaskToMarkdown(
  targetContent: string,
  taskLine: string
): string {
  const trimmed = targetContent.trimEnd();
  if (!trimmed) return taskLine;
  return `${trimmed}\n${taskLine}`;
}
