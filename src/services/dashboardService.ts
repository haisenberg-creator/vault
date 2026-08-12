import { load as parseYaml } from "js-yaml";
import {
  DashboardFilter,
  DashboardQueryResult,
  DashboardSchema,
  DashboardSectionConfig,
  DashboardSectionResult,
  TaskGroup,
  TaskGroupingOption,
  TaskItemWithMetadata,
  TaskSortingOption,
  TaskState,
} from "../types/dashboard";
import { normalizePath, WorkspaceFile } from "./fileService";

/**
 * Extracts hashtag tags (e.g., #urgent, #bug) from text.
 */
export function extractTags(text: string): string[] {
  const matches = text.match(/#[\w\d/_-]+/g);
  if (!matches) return [];
  // Return unique tags preserving case
  return Array.from(new Set(matches));
}

/**
 * Parses raw dashboard file content and YAML frontmatter into a DashboardSchema.
 */
export function parseDashboardSchema(
  content: string,
  filePath?: string
): DashboardSchema {
  let rawYaml: Record<string, any> | null = null;
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (frontmatterMatch) {
    try {
      const parsed = parseYaml(frontmatterMatch[1]);
      if (parsed && typeof parsed === "object") {
        rawYaml = parsed as Record<string, any>;
      }
    } catch (err) {
      console.warn("Failed to parse dashboard YAML frontmatter:", err);
    }
  }

  // Derive dashboard title
  let title = "Untitled Dashboard";
  if (rawYaml && typeof rawYaml.title === "string" && rawYaml.title.trim()) {
    title = rawYaml.title.trim();
  } else if (filePath) {
    const fileName = normalizePath(filePath).split("/").pop() || "";
    title =
      fileName.replace(/\.(dashboard\.md|md)$/i, "") || "Untitled Dashboard";
  }

  // Parse section configurations
  const sections: DashboardSectionConfig[] = [];
  if (rawYaml && Array.isArray(rawYaml.sections)) {
    rawYaml.sections.forEach((sec: any, index: number) => {
      if (!sec || typeof sec !== "object") return;

      const secId =
        typeof sec.id === "string" && sec.id.trim()
          ? sec.id.trim()
          : `sec-${index + 1}`;

      const secTitle =
        typeof sec.title === "string" && sec.title.trim()
          ? sec.title.trim()
          : `Section ${index + 1}`;

      let filter: DashboardFilter | undefined = undefined;
      if (sec.filter && typeof sec.filter === "object") {
        const rawFilter = sec.filter;

        const state: TaskState[] = [];
        if (Array.isArray(rawFilter.state)) {
          rawFilter.state.forEach((st: any) => {
            if (
              st === "open" ||
              st === "in_progress" ||
              st === "blocked" ||
              st === "completed"
            ) {
              state.push(st);
            }
          });
        }

        const tags: string[] = [];
        if (Array.isArray(rawFilter.tags)) {
          rawFilter.tags.forEach((tg: any) => {
            if (typeof tg === "string" && tg.trim()) {
              const tagStr = tg.trim();
              tags.push(tagStr.startsWith("#") ? tagStr : `#${tagStr}`);
            }
          });
        }

        const folder =
          typeof rawFilter.folder === "string"
            ? normalizePath(rawFilter.folder)
            : undefined;

        const recursive =
          typeof rawFilter.recursive === "boolean" ? rawFilter.recursive : true;

        filter = {
          ...(state.length > 0 ? { state } : {}),
          ...(tags.length > 0 ? { tags } : {}),
          ...(folder !== undefined ? { folder } : {}),
          recursive,
        };
      }

      const validGroupings: TaskGroupingOption[] = [
        "folder",
        "note",
        "tag",
        "state",
        "none",
      ];
      const groupBy: TaskGroupingOption = validGroupings.includes(sec.groupBy)
        ? sec.groupBy
        : "none";

      const validSortings: TaskSortingOption[] = [
        "state",
        "title",
        "file",
        "none",
      ];
      const sortBy: TaskSortingOption = validSortings.includes(sec.sortBy)
        ? sec.sortBy
        : "none";

      sections.push({
        id: secId,
        title: secTitle,
        filter,
        groupBy,
        sortBy,
      });
    });
  }

  // Fallback if no valid sections parsed
  if (sections.length === 0) {
    sections.push({
      id: "sec-1",
      title: "All Tasks",
      filter: { recursive: true },
      groupBy: "none",
      sortBy: "none",
    });
  }

  return {
    type: "dashboard",
    title,
    sections,
    dashboardFilePath: filePath ? normalizePath(filePath) : undefined,
  };
}

/**
 * Scans all WorkspaceFile items and parses all checklist tasks with enriched metadata.
 */
export function parseTasksFromVaultFiles(
  files: WorkspaceFile[]
): TaskItemWithMetadata[] {
  const allTasks: TaskItemWithMetadata[] = [];

  files.forEach((file) => {
    const normPath = normalizePath(file.path);
    // Ignore dashboard files themselves when collecting source tasks
    if (
      normPath.endsWith(".dashboard.md") ||
      file.content
        .match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
        .includes("type: dashboard")
    ) {
      return;
    }

    const pathParts = normPath.split("/");
    const noteName = pathParts.pop() || normPath;
    const folderPath = pathParts.join("/");

    const lines = file.content.split(/\r?\n/);
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

        const tags = extractTags(line);

        allTasks.push({
          id: `${normPath}:${index}:${title}`,
          nodeKey: `${normPath}:${index}`,
          title,
          sourceFile: normPath,
          state,
          tags,
          folderPath,
          noteName,
          lineIndex: index,
        });
      }
    });
  });

  return allTasks;
}

/**
 * Filters tasks against a DashboardFilter configuration.
 */
export function queryTasks(
  tasks: TaskItemWithMetadata[],
  filter?: DashboardFilter
): TaskItemWithMetadata[] {
  if (!filter) return tasks;

  return tasks.filter((task) => {
    // 1. State filter
    if (filter.state && filter.state.length > 0) {
      if (!filter.state.includes(task.state)) {
        return false;
      }
    }

    // 2. Tag filter (matches if task contains ANY of the filter tags)
    if (filter.tags && filter.tags.length > 0) {
      const normalizedFilterTags = filter.tags.map((t) => t.toLowerCase());
      const taskTagsLower = task.tags.map((t) => t.toLowerCase());
      const hasMatch = normalizedFilterTags.some((ft) =>
        taskTagsLower.includes(ft)
      );
      if (!hasMatch) {
        return false;
      }
    }

    // 3. Folder scope filter
    if (filter.folder !== undefined && filter.folder !== null) {
      const targetFolder = normalizePath(filter.folder);
      const taskFolder = normalizePath(task.folderPath);
      const isRecursive = filter.recursive !== false;

      if (targetFolder !== "" && targetFolder !== "/") {
        if (isRecursive) {
          const matchesFolder =
            taskFolder === targetFolder ||
            taskFolder.startsWith(`${targetFolder}/`);
          if (!matchesFolder) return false;
        } else {
          if (taskFolder !== targetFolder) return false;
        }
      }
    }

    return true;
  });
}

/**
 * Groups and sorts filtered tasks into structured TaskGroup blocks.
 */
export function groupAndSortTasks(
  tasks: TaskItemWithMetadata[],
  groupBy: TaskGroupingOption = "none",
  sortBy: TaskSortingOption = "none"
): TaskGroup[] {
  // Sort function helper
  const sortTasks = (items: TaskItemWithMetadata[]): TaskItemWithMetadata[] => {
    const list = [...items];
    if (sortBy === "state") {
      const statePriority: Record<TaskState, number> = {
        open: 1,
        in_progress: 2,
        blocked: 3,
        completed: 4,
      };
      list.sort((a, b) => statePriority[a.state] - statePriority[b.state]);
    } else if (sortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "file") {
      list.sort((a, b) => {
        const fileComp = a.sourceFile.localeCompare(b.sourceFile);
        if (fileComp !== 0) return fileComp;
        return a.lineIndex - b.lineIndex;
      });
    }
    return list;
  };

  if (groupBy === "none" || !groupBy) {
    return [
      {
        id: "all",
        title: "All Tasks",
        groupKey: "all",
        tasks: sortTasks(tasks),
      },
    ];
  }

  const groupMap = new Map<
    string,
    { title: string; tasks: TaskItemWithMetadata[] }
  >();

  if (groupBy === "folder") {
    tasks.forEach((task) => {
      const key = task.folderPath || "Root";
      const title = task.folderPath || "Root";
      if (!groupMap.has(key)) {
        groupMap.set(key, { title, tasks: [] });
      }
      groupMap.get(key)!.tasks.push(task);
    });
  } else if (groupBy === "note") {
    tasks.forEach((task) => {
      const key = task.sourceFile;
      const title = task.noteName;
      if (!groupMap.has(key)) {
        groupMap.set(key, { title, tasks: [] });
      }
      groupMap.get(key)!.tasks.push(task);
    });
  } else if (groupBy === "state") {
    const stateTitles: Record<TaskState, string> = {
      open: "Open",
      in_progress: "In Progress",
      blocked: "Blocked",
      completed: "Completed",
    };

    tasks.forEach((task) => {
      const key = task.state;
      const title = stateTitles[task.state];
      if (!groupMap.has(key)) {
        groupMap.set(key, { title, tasks: [] });
      }
      groupMap.get(key)!.tasks.push(task);
    });
  } else if (groupBy === "tag") {
    tasks.forEach((task) => {
      if (task.tags.length === 0) {
        const key = "untagged";
        const title = "Untagged";
        if (!groupMap.has(key)) {
          groupMap.set(key, { title, tasks: [] });
        }
        groupMap.get(key)!.tasks.push(task);
      } else {
        task.tags.forEach((tag) => {
          const key = tag.toLowerCase();
          const title = tag;
          if (!groupMap.has(key)) {
            groupMap.set(key, { title, tasks: [] });
          }
          groupMap.get(key)!.tasks.push(task);
        });
      }
    });
  }

  const result: TaskGroup[] = [];
  groupMap.forEach((val, key) => {
    result.push({
      id: key,
      groupKey: key,
      title: val.title,
      tasks: sortTasks(val.tasks),
    });
  });

  return result;
}

/**
 * High-level orchestration query for executing a Dashboard schema across vault files.
 */
export function executeDashboardQuery(
  files: WorkspaceFile[],
  schema: DashboardSchema
): DashboardQueryResult {
  let allVaultTasks = parseTasksFromVaultFiles(files);

  if (schema.dashboardFilePath) {
    const normDashPath = normalizePath(schema.dashboardFilePath);
    const dashParts = normDashPath.split("/");
    dashParts.pop(); // remove file name
    const dashFolder = dashParts.join("/");

    if (dashFolder !== "") {
      allVaultTasks = allVaultTasks.filter(
        (task) =>
          task.folderPath === dashFolder ||
          task.folderPath.startsWith(`${dashFolder}/`)
      );
    }
  }

  const sectionResults: DashboardSectionResult[] = schema.sections.map(
    (section) => {
      const filteredTasks = queryTasks(allVaultTasks, section.filter);
      const groups = groupAndSortTasks(
        filteredTasks,
        section.groupBy,
        section.sortBy
      );

      return {
        sectionId: section.id,
        sectionTitle: section.title,
        groups,
      };
    }
  );

  return {
    dashboardTitle: schema.title,
    sections: sectionResults,
  };
}
