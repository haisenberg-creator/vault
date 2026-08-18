import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { EditorPane } from "../EditorPane";
import * as fileService from "../../../services/fileService";

describe("EditorPane Component (Lexical)", () => {
  beforeEach(() => {
    fileService.clearMockStorage();
    vi.restoreAllMocks();
    if (typeof window !== "undefined" && !window.DragEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).DragEvent = class DragEvent extends Event {
        dataTransfer = { types: [] };
      };
    }
  });

  it("loads and displays markdown content in Lexical on mount", async () => {
    fileService.setMockFileContent(
      "test-file.md",
      "# Heading\n- [ ] Open task"
    );

    render(<EditorPane filename="test-file.md" />);

    expect(screen.getByText("Loading document...")).toBeInTheDocument();

    const editor = await screen.findByTestId("editor-contenteditable");
    expect(editor).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Heading")).toBeInTheDocument();
      expect(screen.getByText("1 Tasks (0 Completed)")).toBeInTheDocument();
    });
  });

  it("updates content and triggers debounced auto-save on typing", async () => {
    const writeSpy = vi.spyOn(fileService, "writeMarkdownFile");
    fileService.setMockFileContent("notes.md", "Initial text");

    render(<EditorPane filename="notes.md" />);

    const editor = await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Initial text")).toBeInTheDocument();
    });

    // Update Lexical editor state to simulate typing/editing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lexicalEditor = (editor as any).__lexicalEditor;
    expect(lexicalEditor).toBeDefined();

    act(() => {
      lexicalEditor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode("Updated text with - [x] Done"));
        root.append(paragraph);
      });
    });

    // Wait for 500ms debounce save
    await waitFor(
      () => {
        expect(writeSpy).toHaveBeenCalledWith(
          "notes.md",
          "Updated text with - [x] Done"
        );
      },
      { timeout: 1000 }
    );

    expect(screen.getByTestId("save-status-badge")).toHaveTextContent("Saved");
  });

  it("saves immediately when pressing Ctrl+S", async () => {
    const writeSpy = vi.spyOn(fileService, "writeMarkdownFile");
    fileService.setMockFileContent("quick-save.md", "Before save");

    render(<EditorPane filename="quick-save.md" />);

    const editor = await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Before save")).toBeInTheDocument();
    });

    fireEvent.keyDown(editor, { key: "s", ctrlKey: true });

    expect(writeSpy).toHaveBeenCalledWith("quick-save.md", "Before save");
    await waitFor(() => {
      expect(screen.getByTestId("save-status-badge")).toHaveTextContent(
        "Saved"
      );
    });
  });

  it("inserts priority headers template when priority template button is clicked", async () => {
    const writeSpy = vi.spyOn(fileService, "writeMarkdownFile");
    fileService.setMockFileContent("template-test.md", "Existing Content");

    render(<EditorPane filename="template-test.md" />);

    await screen.findByTestId("editor-contenteditable");

    const templateBtn = screen.getByTestId("note-action-priority-template");
    fireEvent.click(templateBtn);

    await waitFor(
      () => {
        expect(writeSpy).toHaveBeenCalledWith(
          "template-test.md",
          "Existing Content\n\n## Urgent\n\n- [ ] \n\n## High\n\n- [ ] \n\n## Low\n\n- [ ] "
        );
      },
      { timeout: 1000 }
    );
  });

  it("creates task and focuses editor when clicking New Task button", async () => {
    fileService.setMockFileContent("task-focus.md", "Initial note");

    render(<EditorPane filename="task-focus.md" />);

    await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Initial note")).toBeInTheDocument();
    });

    const addBtn = screen.getByTestId("note-action-add-task");
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText("1 Tasks (0 Completed)")).toBeInTheDocument();
      expect(screen.getByTestId("checklist-node-open")).toBeInTheDocument();
    });
  });

  it("handles Enter key on non-empty and empty task lines", async () => {
    fileService.setMockFileContent("enter-test.md", "- [ ] Task 1");

    render(<EditorPane filename="enter-test.md" />);

    const editor = await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lexicalEditor = (editor as any).__lexicalEditor;
    expect(lexicalEditor).toBeDefined();

    // 1. Press Enter on non-empty task line -> creates new uncompleted task
    act(() => {
      lexicalEditor.update(() => {
        const root = $getRoot();
        const firstParagraph = root.getFirstChild();
        if (firstParagraph) {
          firstParagraph.selectEnd();
        }
      });
    });

    act(() => {
      fireEvent.keyDown(editor, { key: "Enter", code: "Enter" });
    });

    await waitFor(() => {
      expect(screen.getByText("2 Tasks (0 Completed)")).toBeInTheDocument();
    });

    // 2. Press Enter on empty task line -> converts to standard paragraph (escapes list)
    act(() => {
      lexicalEditor.update(() => {
        const root = $getRoot();
        const lastParagraph = root.getLastChild();
        if (lastParagraph) {
          lastParagraph.selectEnd();
        }
      });
    });

    act(() => {
      fireEvent.keyDown(editor, { key: "Enter", code: "Enter" });
    });

    await waitFor(() => {
      expect(screen.getByText("1 Tasks (0 Completed)")).toBeInTheDocument();
    });
  });

  it("disables browser native spellcheck on the ContentEditable component", async () => {
    fileService.setMockFileContent(
      "spellcheck.md",
      "Tiếng Việt không có squiggle"
    );

    render(<EditorPane filename="spellcheck.md" />);

    const editor = await screen.findByTestId("editor-contenteditable");
    expect(editor.getAttribute("spellcheck")).toBe("false");
  });

  it("renders custom marker style prefixes in markdown lists", async () => {
    fileService.setMockFileContent(
      "markers.md",
      "- Dash item\n+ Plus item\n* Star item"
    );

    render(<EditorPane filename="markers.md" />);

    await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Dash item")).toBeInTheDocument();
      expect(screen.getByText("Plus item")).toBeInTheDocument();
      expect(screen.getByText("Star item")).toBeInTheDocument();
    });
  });

  it("converts => to arrow symbol ⇒ when loading note containing =>", async () => {
    fileService.setMockFileContent("arrow.md", "Action => Result");

    render(<EditorPane filename="arrow.md" />);

    await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Action ⇒ Result")).toBeInTheDocument();
    });
  });

  it("inserts priority header when Urgent, High, or Low button is clicked", async () => {
    const writeSpy = vi.spyOn(fileService, "writeMarkdownFile");
    fileService.setMockFileContent("priority-test.md", "Task note");

    render(<EditorPane filename="priority-test.md" />);

    await screen.findByTestId("editor-contenteditable");

    const urgentBtn = screen.getByTestId("note-action-priority-urgent");
    fireEvent.click(urgentBtn);

    await waitFor(
      () => {
        expect(writeSpy).toHaveBeenCalledWith(
          "priority-test.md",
          "Task note\n\n## Urgent\n\n- [ ] "
        );
      },
      { timeout: 1000 }
    );
  });

  it("decorates H2 priority headers with data-priority attributes in the editor DOM", async () => {
    fileService.setMockFileContent(
      "priority-headers.md",
      "## Urgent\n- [ ] Critical\n\n## High\n- [ ] Medium\n\n## Low\n- [ ] Minor"
    );

    const { container } = render(<EditorPane filename="priority-headers.md" />);

    await screen.findByTestId("editor-contenteditable");

    await waitFor(() => {
      const urgentH2 = container.querySelector('h2[data-priority="urgent"]');
      const highH2 = container.querySelector('h2[data-priority="high"]');
      const lowH2 = container.querySelector('h2[data-priority="low"]');

      expect(urgentH2).toBeInTheDocument();
      expect(urgentH2).toHaveTextContent("Urgent");

      expect(highH2).toBeInTheDocument();
      expect(highH2).toHaveTextContent("High");

      expect(lowH2).toBeInTheDocument();
      expect(lowH2).toHaveTextContent("Low");
    });
  });

  it("allows dragging a task and dropping it underneath a Priority Header", async () => {
    const writeSpy = vi.spyOn(fileService, "writeMarkdownFile");
    fileService.setMockFileContent(
      "drag-priority.md",
      "- [ ] Move me\n\n## Urgent\n- [ ] Existing urgent"
    );

    const { container } = render(<EditorPane filename="drag-priority.md" />);

    await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Move me")).toBeInTheDocument();
      expect(screen.getByText("Existing urgent")).toBeInTheDocument();
    });

    const taskPills = screen.getAllByTestId("checklist-node-open");
    const taskPill = taskPills[0];
    const urgentH2 = container.querySelector('h2[data-priority="urgent"]')!;

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, val: string) {
        this.data[type] = val;
      },
      getData(type: string) {
        return this.data[type] || "";
      },
      effectAllowed: "",
      dropEffect: "",
    };

    fireEvent.dragStart(taskPill, { dataTransfer });
    fireEvent.dragOver(urgentH2, { dataTransfer });
    fireEvent.drop(urgentH2, { dataTransfer });

    await waitFor(
      () => {
        expect(writeSpy).toHaveBeenCalled();
        const savedContent =
          writeSpy.mock.calls[writeSpy.mock.calls.length - 1][1];
        expect(savedContent).toContain("## Urgent");
        expect(savedContent.indexOf("## Urgent")).toBeLessThan(
          savedContent.indexOf("Move me")
        );
      },
      { timeout: 1000 }
    );
  });

  it("creates task via status toolbar buttons (Open, In Progress, Blocked, Done) and deletes cleanly without phantom dot marker", async () => {
    const onTasksChange = vi.fn();
    const writeSpy = vi.spyOn(fileService, "writeMarkdownFile");
    fileService.setMockFileContent("status-btn-test.md", "");

    const { container } = render(
      <EditorPane filename="status-btn-test.md" onTasksChange={onTasksChange} />
    );

    const editor = await screen.findByTestId("editor-contenteditable");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lexicalEditor = (editor as any).__lexicalEditor;
    expect(lexicalEditor).toBeDefined();

    // 1. Click In Progress status button to create task
    const inProgressBtn = screen.getByTestId("note-status-in_progress");
    fireEvent.click(inProgressBtn);

    await waitFor(() => {
      expect(
        screen.getByTestId("checklist-node-in_progress")
      ).toBeInTheDocument();
    });

    // 2. Verify onTasksChange receives 1 task
    await waitFor(() => {
      const lastTasksCall =
        onTasksChange.mock.calls[onTasksChange.mock.calls.length - 1][0];
      expect(lastTasksCall.length).toBe(1);
      expect(lastTasksCall[0].state).toBe("in_progress");
    });

    // 3. Delete the task
    act(() => {
      lexicalEditor.update(() => {
        const root = $getRoot();
        root.clear();
        const p = $createParagraphNode();
        root.append(p);
        p.select();
      });
    });

    // 4. Verify onTasksChange fires with 0 tasks
    await waitFor(() => {
      const lastTasksCall =
        onTasksChange.mock.calls[onTasksChange.mock.calls.length - 1][0];
      expect(lastTasksCall.length).toBe(0);
    });

    // 5. Verify no stray • or bullet markers in container or markdown output
    expect(container.textContent).not.toContain("•");
    await waitFor(
      () => {
        if (writeSpy.mock.calls.length > 0) {
          const savedContent =
            writeSpy.mock.calls[writeSpy.mock.calls.length - 1][1];
          expect(savedContent).not.toContain("•");
          expect(savedContent).not.toContain("[-]");
        }
      },
      { timeout: 1000 }
    );
  });

  it("updates existing task status in place when status button is clicked while focused on task", async () => {
    fileService.setMockFileContent("status-update.md", "- [ ] Existing task");

    render(<EditorPane filename="status-update.md" />);

    const editor = await screen.findByTestId("editor-contenteditable");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lexicalEditor = (editor as any).__lexicalEditor;
    expect(lexicalEditor).toBeDefined();

    await waitFor(() => {
      expect(screen.getByTestId("checklist-node-open")).toBeInTheDocument();
    });

    // Select inside the existing task
    act(() => {
      lexicalEditor.update(() => {
        const root = $getRoot();
        const firstChild = root.getFirstChild();
        firstChild?.selectStart();
      });
    });

    // Click "Blocked" status button
    const blockedBtn = screen.getByTestId("note-status-blocked");
    fireEvent.click(blockedBtn);

    await waitFor(() => {
      expect(screen.getByTestId("checklist-node-blocked")).toBeInTheDocument();
      expect(
        screen.queryByTestId("checklist-node-open")
      ).not.toBeInTheDocument();
    });
  });
});
