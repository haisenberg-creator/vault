import { describe, it, expect } from "vitest";
import {
  parseTasksFromMarkdown,
  toggleTaskInMarkdown,
  removeTaskFromMarkdown,
  appendTaskToMarkdown,
} from "../workspaceService";

describe("workspaceService", () => {
  it("parses tasks with all 4 checklist states correctly", () => {
    const markdown = `# Project Tasks
- [ ] Open task item
- [-] Task in progress
- [>] Blocked task item
- [x] Completed task item
`;

    const tasks = parseTasksFromMarkdown(markdown, "roadmap.md");
    expect(tasks).toHaveLength(4);

    expect(tasks[0]).toEqual({
      id: "roadmap.md:1:Open task item",
      nodeKey: "roadmap.md:1",
      title: "Open task item",
      sourceFile: "roadmap.md",
      state: "open",
      tags: [],
      priority: undefined,
    });

    expect(tasks[1]).toEqual({
      id: "roadmap.md:2:Task in progress",
      nodeKey: "roadmap.md:2",
      title: "Task in progress",
      sourceFile: "roadmap.md",
      state: "in_progress",
      tags: [],
      priority: undefined,
    });

    expect(tasks[2]).toEqual({
      id: "roadmap.md:3:Blocked task item",
      nodeKey: "roadmap.md:3",
      title: "Blocked task item",
      sourceFile: "roadmap.md",
      state: "blocked",
      tags: [],
      priority: undefined,
    });

    expect(tasks[3]).toEqual({
      id: "roadmap.md:4:Completed task item",
      nodeKey: "roadmap.md:4",
      title: "Completed task item",
      sourceFile: "roadmap.md",
      state: "completed",
      tags: [],
      priority: undefined,
    });
  });

  it("extracts hashtags into tags array on parsed tasks", () => {
    const markdown = `# Tasks with hashtags
- [ ] Implement dark mode #theme #ui/ux
- [-] Fix payment webhook #urgent #backend
- [x] Simple task without tags
`;

    const tasks = parseTasksFromMarkdown(markdown, "tags-note.md");
    expect(tasks).toHaveLength(3);
    expect(tasks[0].tags).toEqual(["#theme", "#ui/ux"]);
    expect(tasks[1].tags).toEqual(["#urgent", "#backend"]);
    expect(tasks[2].tags).toEqual([]);
  });

  it("extracts priority from nearest preceding priority header (## or ###) and resets on other headers", () => {
    const markdown = `# Document Title
## Urgent
- [ ] Fix critical production crash
### High
- [-] Performance optimization
## Other Heading
- [ ] Task without priority
## Low
- [x] Minor documentation fix
`;

    const tasks = parseTasksFromMarkdown(markdown, "tasks.md");
    expect(tasks).toHaveLength(4);

    expect(tasks[0]).toMatchObject({
      title: "Fix critical production crash",
      priority: "urgent",
    });

    expect(tasks[1]).toMatchObject({
      title: "Performance optimization",
      priority: "high",
    });

    expect(tasks[2]).toMatchObject({
      title: "Task without priority",
      priority: undefined,
    });

    expect(tasks[3]).toMatchObject({
      title: "Minor documentation fix",
      priority: "low",
    });
  });

  it("toggles task state in raw markdown content sequentially", () => {
    const initialMarkdown = `- [ ] Implement feature`;

    // open -> in_progress
    const step1 = toggleTaskInMarkdown(initialMarkdown, "Implement feature");
    expect(step1).toBe("- [-] Implement feature");

    // in_progress -> completed
    const step2 = toggleTaskInMarkdown(step1, "Implement feature");
    expect(step2).toBe("- [x] Implement feature");

    // completed -> blocked
    const step3 = toggleTaskInMarkdown(step2, "Implement feature");
    expect(step3).toBe("- [>] Implement feature");

    // blocked -> open
    const step4 = toggleTaskInMarkdown(step3, "Implement feature");
    expect(step4).toBe("- [ ] Implement feature");
  });

  it("toggles task state to explicitly specified target state", () => {
    const initialMarkdown = `- [ ] Implement feature`;
    const result = toggleTaskInMarkdown(
      initialMarkdown,
      "Implement feature",
      "completed"
    );
    expect(result).toBe("- [x] Implement feature");
  });

  it("removes a task line from markdown content and appends it to target content", () => {
    const sourceMarkdown = `# Source Note\n- [ ] Dragged task\n- [-] Keep task`;
    const targetMarkdown = `# Target Note\n- [x] Existing task`;

    const { updatedContent, removedTaskLine } = removeTaskFromMarkdown(
      sourceMarkdown,
      "Dragged task"
    );

    expect(updatedContent).toBe("# Source Note\n- [-] Keep task");
    expect(removedTaskLine).toBe("- [ ] Dragged task");

    const newTarget = appendTaskToMarkdown(targetMarkdown, removedTaskLine!);
    expect(newTarget).toBe(
      "# Target Note\n- [x] Existing task\n- [ ] Dragged task"
    );
  });

  it("preserves completed task state ([x]) when moving task between markdown notes", () => {
    const sourceMarkdown = `# Note 1\n- [x] Set up Dual Column layout shell with Rosé Pine tokens\n- [ ] Remaining task`;
    const targetMarkdown = `# test-dragging.md\n- [ ] Initial task`;

    const { updatedContent, removedTaskLine } = removeTaskFromMarkdown(
      sourceMarkdown,
      "Set up Dual Column layout shell with Rosé Pine tokens"
    );

    expect(updatedContent).toBe("# Note 1\n- [ ] Remaining task");
    expect(removedTaskLine).toBe(
      "- [x] Set up Dual Column layout shell with Rosé Pine tokens"
    );

    const newTarget = appendTaskToMarkdown(targetMarkdown, removedTaskLine!);
    expect(newTarget).toBe(
      "# test-dragging.md\n- [ ] Initial task\n- [x] Set up Dual Column layout shell with Rosé Pine tokens"
    );
  });

  describe("smart appendTaskToMarkdown with priority", () => {
    it("appends task under an existing matching priority header without mangling other sections", () => {
      const targetMarkdown = `# Project Notes\n\n## Urgent\n- [ ] Fix critical bug\n\n## Low\n- [ ] Minor cleanup`;
      const result = appendTaskToMarkdown(
        targetMarkdown,
        "- [ ] Patch security issue",
        "urgent"
      );

      expect(result).toBe(
        `# Project Notes\n\n## Urgent\n- [ ] Fix critical bug\n- [ ] Patch security issue\n\n## Low\n- [ ] Minor cleanup`
      );
    });

    it("appends a new priority header and task to bottom if matching header does not exist", () => {
      const targetMarkdown = `# Project Notes\n\n## Low\n- [ ] Minor cleanup`;
      const result = appendTaskToMarkdown(
        targetMarkdown,
        "- [ ] Urgent hotfix",
        "urgent"
      );

      expect(result).toBe(
        `# Project Notes\n\n## Low\n- [ ] Minor cleanup\n\n## Urgent\n- [ ] Urgent hotfix`
      );
    });

    it("handles empty target content when appending with priority", () => {
      const result = appendTaskToMarkdown("", "- [ ] Urgent hotfix", "urgent");
      expect(result).toBe("## Urgent\n- [ ] Urgent hotfix");
    });
  });
});
