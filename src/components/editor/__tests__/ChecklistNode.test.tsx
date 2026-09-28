import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createEditor } from "lexical";
import { EditorPane } from "../EditorPane";
import {
  parseTaskState,
  formatTaskState,
  getNextTaskState,
  ChecklistNode,
  $createChecklistNode,
  $isChecklistNode,
} from "../ChecklistNode";
import * as fileService from "../../../services/fileService";

vi.mock("../../../services/fileService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../services/fileService")>();
  return {
    ...actual,
    readMarkdownFile: vi.fn(),
    writeMarkdownFile: vi.fn(),
  };
});

describe("ChecklistNode utilities", () => {
  it("correctly parses raw syntax to TaskState", () => {
    expect(parseTaskState(" ")).toBe("open");
    expect(parseTaskState("-")).toBe("in_progress");
    expect(parseTaskState("x")).toBe("completed");
    expect(parseTaskState("X")).toBe("completed");
    expect(parseTaskState(">")).toBe("blocked");
    expect(parseTaskState("unknown")).toBe("open");
  });

  it("correctly formats TaskState back to Markdown syntax", () => {
    expect(formatTaskState("open")).toBe("[ ]");
    expect(formatTaskState("in_progress")).toBe("[-]");
    expect(formatTaskState("completed")).toBe("[x]");
    expect(formatTaskState("blocked")).toBe("[>]");
  });

  it("cycles states correctly", () => {
    expect(getNextTaskState("open")).toBe("in_progress");
    expect(getNextTaskState("in_progress")).toBe("completed");
    expect(getNextTaskState("completed")).toBe("blocked");
    expect(getNextTaskState("blocked")).toBe("open");
  });
});

describe("ChecklistNode Lexical Node", () => {
  it("instantiates and manages state correctly", () => {
    const editor = createEditor({ nodes: [ChecklistNode] });
    editor.update(() => {
      const node = $createChecklistNode("in_progress");
      expect($isChecklistNode(node)).toBe(true);
      expect(node.getState()).toBe("in_progress");
      expect(node.getMarkdownSyntax()).toBe("[-]");
      expect(node.getTextContent()).toBe("[-]");
    });
  });

  it("supports JSON serialization and deserialization", () => {
    const editor = createEditor({ nodes: [ChecklistNode] });
    editor.update(() => {
      const node = $createChecklistNode("blocked");
      const json = node.exportJSON();
      expect(json).toEqual({
        type: "checklist-item",
        state: "blocked",
        version: 1,
      });

      const imported = ChecklistNode.importJSON(json);
      expect(imported.getState()).toBe("blocked");
    });
  });

  it("creates DOM element with flexShrink 0 and inline-flex display", () => {
    const editor = createEditor({ nodes: [ChecklistNode] });
    editor.update(() => {
      const node = $createChecklistNode("open");
      const dom = node.createDOM();
      expect(dom.style.display).toBe("inline-flex");
      expect(dom.style.flexShrink).toBe("0");
    });
  });
});

describe("EditorPane with Custom Checklist Nodes", () => {
  it("renders checklist nodes from markdown input", async () => {
    const markdownContent = [
      "- [ ] Open task",
      "- [-] In progress task",
      "- [x] Completed task",
      "- [>] Blocked task",
    ].join("\n");

    vi.mocked(fileService.readMarkdownFile).mockResolvedValue(markdownContent);

    render(<EditorPane filename="test-tasks.md" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading document...")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("checklist-node-open")).toBeInTheDocument();
      expect(
        screen.getByTestId("checklist-node-in_progress")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("checklist-node-completed")
      ).toBeInTheDocument();
      expect(screen.getByTestId("checklist-node-blocked")).toBeInTheDocument();
    });
  });

  it("toggles state on click and triggers auto-save with updated markdown", async () => {
    const markdownContent = "- [ ] Task to toggle";
    vi.mocked(fileService.readMarkdownFile).mockResolvedValue(markdownContent);
    vi.mocked(fileService.writeMarkdownFile).mockResolvedValue();

    render(<EditorPane filename="test-toggle.md" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading document...")).not.toBeInTheDocument();
    });

    const openBadge = await screen.findByTestId("checklist-node-open");
    expect(openBadge).toBeInTheDocument();

    fireEvent.click(openBadge);

    await waitFor(
      () => {
        expect(fileService.writeMarkdownFile).toHaveBeenCalledWith(
          "test-toggle.md",
          expect.stringContaining("[-]")
        );
      },
      { timeout: 1500 }
    );
  });

  it("allows dragging for completed tasks in the editor with completed state in payload", async () => {
    const markdownContent = "- [ ] Open Task\n- [x] Completed Task";
    vi.mocked(fileService.readMarkdownFile).mockResolvedValue(markdownContent);

    render(<EditorPane filename="test-drag.md" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading document...")).not.toBeInTheDocument();
    });

    const openBadge = await screen.findByTestId("checklist-node-open");
    expect(openBadge).toHaveAttribute("draggable", "true");

    const completedBadge = await screen.findByTestId(
      "checklist-node-completed"
    );
    expect(completedBadge).toHaveAttribute("draggable", "true");

    const setDataSpy = vi.fn();
    fireEvent.dragStart(completedBadge, {
      dataTransfer: {
        setData: setDataSpy,
      },
    });
    expect(setDataSpy).toHaveBeenCalledWith(
      "application/json",
      expect.stringContaining('"state":"completed"')
    );
  });

  it("structures task items as flex containers with hanging indent styles", async () => {
    const markdownContent =
      "- [ ] First task with a very long line of descriptive text that wraps\n- [-] Second in-progress task";
    vi.mocked(fileService.readMarkdownFile).mockResolvedValue(markdownContent);

    const { container } = render(
      <EditorPane filename="test-hanging-indent.md" />
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading document...")).not.toBeInTheDocument();
    });

    const openBadge = await screen.findByTestId("checklist-node-open");
    expect(openBadge).toBeInTheDocument();
    // Verify badge has flexShrink: 0
    expect(openBadge.style.flexShrink).toBe("0");

    await waitFor(() => {
      // Find the task item container paragraph
      const taskContainer = container.querySelector(
        '[data-task-item="true"]'
      ) as HTMLElement | null;
      expect(taskContainer).toBeInTheDocument();
      expect(taskContainer?.style.display).toBe("flex");
      expect(taskContainer?.style.alignItems).toBe("flex-start");
      expect(taskContainer?.style.gap).toBe("6px");

      // Verify task content text has hanging-indent properties
      const taskContent = container.querySelector(
        ".task-content-text"
      ) as HTMLElement | null;
      expect(taskContent).toBeInTheDocument();
      expect(taskContent?.style.flex).toContain("1");
      expect(taskContent?.style.wordBreak).toBe("break-word");
    });
  });
});
