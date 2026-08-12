import { describe, it, expect } from "vitest";
import {
  parseDashboardSchema,
  extractTags,
  parseTasksFromVaultFiles,
  queryTasks,
  groupAndSortTasks,
  executeDashboardQuery,
} from "../dashboardService";
import { WorkspaceFile } from "../fileService";

describe("dashboardService", () => {
  describe("parseDashboardSchema", () => {
    it("parses valid YAML frontmatter into a DashboardSchema", () => {
      const content = `---
type: dashboard
title: My Project Dashboard
sections:
  - id: sec-1
    title: Active Work
    filter:
      state: [in_progress, blocked]
      folder: "Projects"
      recursive: true
    groupBy: folder
    sortBy: state
  - id: sec-2
    title: Urgent Tasks
    filter:
      tags: ["#urgent"]
    groupBy: state
---

# Extra markdown body text
`;

      const schema = parseDashboardSchema(
        content,
        "dashboards/overview.dashboard.md"
      );
      expect(schema.type).toBe("dashboard");
      expect(schema.title).toBe("My Project Dashboard");
      expect(schema.sections).toHaveLength(2);

      expect(schema.sections[0]).toEqual({
        id: "sec-1",
        title: "Active Work",
        filter: {
          state: ["in_progress", "blocked"],
          folder: "Projects",
          recursive: true,
        },
        groupBy: "folder",
        sortBy: "state",
      });

      expect(schema.sections[1].title).toBe("Urgent Tasks");
      expect(schema.sections[1].filter?.tags).toEqual(["#urgent"]);
      expect(schema.sections[1].groupBy).toBe("state");
    });

    it("falls back to file basename title when frontmatter title is omitted", () => {
      const content = `---
type: dashboard
---
`;
      const schema = parseDashboardSchema(
        content,
        "Projects/Client-A/summary.dashboard.md"
      );
      expect(schema.title).toBe("summary");
      expect(schema.sections).toHaveLength(1);
      expect(schema.sections[0].title).toBe("All Tasks");
    });

    it("handles malformed YAML frontmatter gracefully without crashing", () => {
      const content = `---
invalid_yaml: [ [ [ broken syntax:
---
`;
      const schema = parseDashboardSchema(content, "broken.md");
      expect(schema.type).toBe("dashboard");
      expect(schema.title).toBe("broken");
      expect(schema.sections).toHaveLength(1);
    });
  });

  describe("extractTags", () => {
    it("extracts hashtag tags from task text", () => {
      const text = "Fix login crash on mobile #bug #urgent #v1-release";
      const tags = extractTags(text);
      expect(tags).toEqual(["#bug", "#urgent", "#v1-release"]);
    });

    it("returns empty array when no hashtags are present", () => {
      expect(extractTags("Clean up code documentation")).toEqual([]);
    });
  });

  describe("parseTasksFromVaultFiles", () => {
    it("parses tasks with folder paths, note names, states, and tags across workspace files", () => {
      const mockFiles: WorkspaceFile[] = [
        {
          path: "Projects/Client-A/spec.md",
          name: "spec.md",
          content: `- [ ] Set up client repo #setup
- [-] Implement Auth flow #security #urgent
- [>] Waiting on API keys #blocked
- [x] Initial kickoff meeting
`,
        },
        {
          path: "Notes/ideas.md",
          name: "ideas.md",
          content: `- [ ] Write blog post #writing`,
        },
      ];

      const tasks = parseTasksFromVaultFiles(mockFiles);
      expect(tasks).toHaveLength(5);

      expect(tasks[0]).toMatchObject({
        title: "Set up client repo #setup",
        sourceFile: "Projects/Client-A/spec.md",
        folderPath: "Projects/Client-A",
        noteName: "spec.md",
        state: "open",
        tags: ["#setup"],
      });

      expect(tasks[1]).toMatchObject({
        title: "Implement Auth flow #security #urgent",
        state: "in_progress",
        tags: ["#security", "#urgent"],
      });

      expect(tasks[2].state).toBe("blocked");
      expect(tasks[3].state).toBe("completed");

      expect(tasks[4]).toMatchObject({
        sourceFile: "Notes/ideas.md",
        folderPath: "Notes",
        noteName: "ideas.md",
        tags: ["#writing"],
      });
    });
  });

  describe("queryTasks", () => {
    const sampleTasks = [
      {
        id: "1",
        nodeKey: "1",
        title: "Task 1 #urgent",
        sourceFile: "Projects/Client-A/todo.md",
        folderPath: "Projects/Client-A",
        noteName: "todo.md",
        state: "open" as const,
        tags: ["#urgent"],
        lineIndex: 0,
      },
      {
        id: "2",
        nodeKey: "2",
        title: "Task 2 #bug",
        sourceFile: "Projects/Client-A/sub/nested.md",
        folderPath: "Projects/Client-A/sub",
        noteName: "nested.md",
        state: "in_progress" as const,
        tags: ["#bug"],
        lineIndex: 1,
      },
      {
        id: "3",
        nodeKey: "3",
        title: "Task 3 #urgent",
        sourceFile: "Projects/Client-B/notes.md",
        folderPath: "Projects/Client-B",
        noteName: "notes.md",
        state: "blocked" as const,
        tags: ["#urgent"],
        lineIndex: 2,
      },
      {
        id: "4",
        nodeKey: "4",
        title: "Task 4",
        sourceFile: "RootTask.md",
        folderPath: "",
        noteName: "RootTask.md",
        state: "completed" as const,
        tags: [],
        lineIndex: 0,
      },
    ];

    it("filters tasks by state", () => {
      const result = queryTasks(sampleTasks, {
        state: ["in_progress", "blocked"],
      });
      expect(result.map((t) => t.id)).toEqual(["2", "3"]);
    });

    it("filters tasks by tags", () => {
      const result = queryTasks(sampleTasks, { tags: ["#urgent"] });
      expect(result.map((t) => t.id)).toEqual(["1", "3"]);
    });

    it("filters tasks by folder path recursively by default", () => {
      const result = queryTasks(sampleTasks, { folder: "Projects/Client-A" });
      expect(result.map((t) => t.id)).toEqual(["1", "2"]);
    });

    it("filters tasks by folder path non-recursively when recursive is false", () => {
      const result = queryTasks(sampleTasks, {
        folder: "Projects/Client-A",
        recursive: false,
      });
      expect(result.map((t) => t.id)).toEqual(["1"]);
    });
  });

  describe("groupAndSortTasks", () => {
    const sampleTasks = [
      {
        id: "1",
        nodeKey: "1",
        title: "B Task #urgent",
        sourceFile: "Projects/Client-A/todo.md",
        folderPath: "Projects/Client-A",
        noteName: "todo.md",
        state: "completed" as const,
        tags: ["#urgent"],
        lineIndex: 0,
      },
      {
        id: "2",
        nodeKey: "2",
        title: "A Task #bug",
        sourceFile: "Projects/Client-A/todo.md",
        folderPath: "Projects/Client-A",
        noteName: "todo.md",
        state: "open" as const,
        tags: ["#bug"],
        lineIndex: 1,
      },
      {
        id: "3",
        nodeKey: "3",
        title: "C Task #urgent",
        sourceFile: "Projects/Client-B/notes.md",
        folderPath: "Projects/Client-B",
        noteName: "notes.md",
        state: "in_progress" as const,
        tags: ["#urgent"],
        lineIndex: 0,
      },
    ];

    it("groups tasks by folder", () => {
      const groups = groupAndSortTasks(sampleTasks, "folder");
      expect(groups).toHaveLength(2);
      expect(groups[0].title).toBe("Projects/Client-A");
      expect(groups[0].tasks).toHaveLength(2);
      expect(groups[1].title).toBe("Projects/Client-B");
      expect(groups[1].tasks).toHaveLength(1);
    });

    it("groups tasks by state", () => {
      const groups = groupAndSortTasks(sampleTasks, "state");
      const groupTitles = groups.map((g) => g.title);
      expect(groupTitles).toContain("Open");
      expect(groupTitles).toContain("In Progress");
      expect(groupTitles).toContain("Completed");
    });

    it("sorts tasks by state", () => {
      const groups = groupAndSortTasks(sampleTasks, "none", "state");
      expect(groups[0].tasks.map((t) => t.state)).toEqual([
        "open",
        "in_progress",
        "completed",
      ]);
    });

    it("sorts tasks by title alphabetically", () => {
      const groups = groupAndSortTasks(sampleTasks, "none", "title");
      expect(groups[0].tasks.map((t) => t.title)).toEqual([
        "A Task #bug",
        "B Task #urgent",
        "C Task #urgent",
      ]);
    });
  });

  describe("executeDashboardQuery", () => {
    it("executes full dashboard query against workspace files", () => {
      const files: WorkspaceFile[] = [
        {
          path: "Projects/Client-A/roadmap.md",
          name: "roadmap.md",
          content: `- [ ] Feature A #urgent\n- [-] Feature B #v1`,
        },
        {
          path: "Projects/Client-B/tasks.md",
          name: "tasks.md",
          content: `- [>] Waiting design approval #urgent`,
        },
      ];

      const schema = parseDashboardSchema(
        `---
type: dashboard
title: Executive View
sections:
  - id: sec-1
    title: Urgent Priority
    filter:
      tags: ["#urgent"]
    groupBy: folder
---`,
        "executive.dashboard.md"
      );

      const result = executeDashboardQuery(files, schema);
      expect(result.dashboardTitle).toBe("Executive View");
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].sectionTitle).toBe("Urgent Priority");
      expect(result.sections[0].groups).toHaveLength(2);
    });

    it("scopes dashboard task query to its containing folder if not in root", () => {
      const files: WorkspaceFile[] = [
        {
          path: "Projects/Alpha/tasks.md",
          name: "tasks.md",
          content: "- [ ] Alpha Task 1\n- [ ] Alpha Task 2",
        },
        {
          path: "Projects/Beta/tasks.md",
          name: "tasks.md",
          content: "- [ ] Beta Task 1",
        },
        {
          path: "RootTask.md",
          name: "RootTask.md",
          content: "- [ ] Root Task",
        },
      ];

      const dashContent = `---
title: Alpha Dashboard
---`;

      const schema = parseDashboardSchema(
        dashContent,
        "Projects/Alpha/alpha.dashboard.md"
      );

      const result = executeDashboardQuery(files, schema);
      const allTasks = result.sections[0].groups.flatMap((g) => g.tasks);
      expect(allTasks).toHaveLength(2);
      expect(
        allTasks.every((t) => t.sourceFile.startsWith("Projects/Alpha/"))
      ).toBe(true);
    });
  });
});
