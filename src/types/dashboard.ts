export type TaskState = "open" | "in_progress" | "blocked" | "completed";

export type TaskGroupingOption = "folder" | "note" | "tag" | "state" | "none";
export type TaskSortingOption = "state" | "title" | "file" | "none";

export interface DashboardFilter {
  state?: TaskState[];
  tags?: string[];
  folder?: string;
  recursive?: boolean;
}

export interface DashboardSectionConfig {
  id: string;
  title: string;
  filter?: DashboardFilter;
  groupBy?: TaskGroupingOption;
  sortBy?: TaskSortingOption;
}

export interface DashboardSchema {
  type: "dashboard";
  title: string;
  sections: DashboardSectionConfig[];
}

export interface TaskItemWithMetadata {
  id: string;
  nodeKey: string;
  title: string;
  sourceFile: string;
  state: TaskState;
  tags: string[];
  folderPath: string;
  noteName: string;
  lineIndex: number;
}

export interface TaskGroup {
  id: string;
  title: string;
  groupKey: string;
  tasks: TaskItemWithMetadata[];
}

export interface DashboardSectionResult {
  sectionId: string;
  sectionTitle: string;
  groups: TaskGroup[];
}

export interface DashboardQueryResult {
  dashboardTitle: string;
  sections: DashboardSectionResult[];
}
