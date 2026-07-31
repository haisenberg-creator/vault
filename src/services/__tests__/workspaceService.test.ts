import { describe, it, expect } from "vitest";
import {
  parseTasksFromMarkdown,
  toggleTaskInMarkdown,
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
    });

    expect(tasks[1]).toEqual({
      id: "roadmap.md:2:Task in progress",
      nodeKey: "roadmap.md:2",
      title: "Task in progress",
      sourceFile: "roadmap.md",
      state: "in_progress",
    });

    expect(tasks[2]).toEqual({
      id: "roadmap.md:3:Blocked task item",
      nodeKey: "roadmap.md:3",
      title: "Blocked task item",
      sourceFile: "roadmap.md",
      state: "blocked",
    });

    expect(tasks[3]).toEqual({
      id: "roadmap.md:4:Completed task item",
      nodeKey: "roadmap.md:4",
      title: "Completed task item",
      sourceFile: "roadmap.md",
      state: "completed",
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
});
