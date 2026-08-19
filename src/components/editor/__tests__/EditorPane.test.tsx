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

  it("treats self-adjacent DnD drops as safe no-ops without duplicating tasks", async () => {
    const onTasksChange = vi.fn();
    fileService.setMockFileContent(
      "self-drop.md",
      "- [ ] Task Alpha\n- [ ] Task Beta\n- [ ] Task Gamma"
    );

    render(
      <EditorPane filename="self-drop.md" onTasksChange={onTasksChange} />
    );

    await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Task Alpha")).toBeInTheDocument();
      expect(screen.getByText("Task Beta")).toBeInTheDocument();
      expect(screen.getByText("Task Gamma")).toBeInTheDocument();
    });

    const taskPills = screen.getAllByTestId("checklist-node-open");
    const betaPill = taskPills[1]; // Task Beta

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

    // 1. Drag Task Beta and drop directly onto itself
    fireEvent.dragStart(betaPill, { dataTransfer });
    fireEvent.dragOver(betaPill, { dataTransfer });
    fireEvent.drop(betaPill, { dataTransfer });

    // Verify task count is still 3 and onTasksChange does not have duplicates
    await waitFor(() => {
      const calls = onTasksChange.mock.calls;
      const lastTasks = calls[calls.length - 1][0];
      expect(lastTasks).toHaveLength(3);
      expect(lastTasks.map((t: any) => t.title)).toEqual([
        "Task Alpha",
        "Task Beta",
        "Task Gamma",
      ]);
    });

    // 2. Drag Task Beta and drop onto immediately preceding sibling (Task Alpha)
    const alphaPill = screen.getAllByTestId("checklist-node-open")[0];
    fireEvent.dragStart(betaPill, { dataTransfer });
    fireEvent.dragOver(alphaPill, { dataTransfer });
    fireEvent.drop(alphaPill, { dataTransfer });

    await waitFor(() => {
      const calls = onTasksChange.mock.calls;
      const lastTasks = calls[calls.length - 1][0];
      expect(lastTasks).toHaveLength(3);
      expect(lastTasks.map((t: any) => t.title)).toEqual([
        "Task Alpha",
        "Task Beta",
        "Task Gamma",
      ]);
    });

    // Verify header task stats display
    expect(screen.getByText("3 Tasks (0 Completed)")).toBeInTheDocument();
  });

  it("moves a task cleanly on cross-position DnD drop without creating phantom duplicates", async () => {
    const onTasksChange = vi.fn();
    fileService.setMockFileContent(
      "cross-drop.md",
      "- [ ] Task Alpha\n- [ ] Task Beta\n- [ ] Task Gamma"
    );

    render(
      <EditorPane filename="cross-drop.md" onTasksChange={onTasksChange} />
    );

    await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Task Alpha")).toBeInTheDocument();
      expect(screen.getByText("Task Beta")).toBeInTheDocument();
      expect(screen.getByText("Task Gamma")).toBeInTheDocument();
    });

    const taskPills = screen.getAllByTestId("checklist-node-open");
    const alphaPill = taskPills[0];
    const gammaPill = taskPills[2];

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

    // Drag Task Alpha and drop onto Task Gamma
    fireEvent.dragStart(alphaPill, { dataTransfer });
    fireEvent.dragOver(gammaPill, { dataTransfer });
    fireEvent.drop(gammaPill, { dataTransfer });

    // Verify task count is still 3 and reordered cleanly: Beta, Gamma, Alpha
    await waitFor(() => {
      const calls = onTasksChange.mock.calls;
      const lastTasks = calls[calls.length - 1][0];
      expect(lastTasks).toHaveLength(3);
      expect(lastTasks.map((t: any) => t.title)).toEqual([
        "Task Beta",
        "Task Gamma",
        "Task Alpha",
      ]);
    });
  });

  it("inserts a new task when dropped from an external source (sidebar/cross-note)", async () => {
    const onTasksChange = vi.fn();
    fileService.setMockFileContent("external-drop.md", "- [ ] Existing Task");

    render(
      <EditorPane filename="external-drop.md" onTasksChange={onTasksChange} />
    );

    await screen.findByTestId("editor-contenteditable");
    await waitFor(() => {
      expect(screen.getByText("Existing Task")).toBeInTheDocument();
    });

    const existingPill = screen.getByTestId("checklist-node-open");

    const dataTransfer = {
      data: {
        "application/json": JSON.stringify({
          taskTitle: "External Imported Task",
          sourceFile: "other-note.md",
          state: "open",
        }),
        "text/plain": "task-drag:External Imported Task",
      } as Record<string, string>,
      setData(type: string, val: string) {
        this.data[type] = val;
      },
      getData(type: string) {
        return this.data[type] || "";
      },
      effectAllowed: "",
      dropEffect: "",
    };

    fireEvent.dragOver(existingPill, { dataTransfer });
    fireEvent.drop(existingPill, { dataTransfer });

    await waitFor(() => {
      const calls = onTasksChange.mock.calls;
      const lastTasks = calls[calls.length - 1][0];
      expect(lastTasks).toHaveLength(2);
      expect(lastTasks.map((t: any) => t.title)).toEqual([
        "Existing Task",
        "External Imported Task",
      ]);
    });
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

  it("displays truncated short path in sub-header when filename is an absolute path", async () => {
    fileService.setMockFileContent(
      "Projects/Lucky Draw.md",
      "# Lucky Draw Note"
    );

    render(
      <EditorPane
        filename="C:/Users/ANH-NTP/AppData/Roaming/com.user.vault-app/workspace/Projects/Lucky Draw.md"
        workspaceDir="C:/Users/ANH-NTP/AppData/Roaming/com.user.vault-app/workspace"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Projects/Lucky Draw.md")).toBeInTheDocument();
      expect(
        screen.queryByText(
          "C:/Users/ANH-NTP/AppData/Roaming/com.user.vault-app/workspace/Projects/Lucky Draw.md"
        )
      ).not.toBeInTheDocument();
    });
  });

  it("renders formatting toolbar with Bold, Italic, Strikethrough, and Highlight buttons", async () => {
    fileService.setMockFileContent("format-test.md", "Sample text");

    render(<EditorPane filename="format-test.md" />);

    await screen.findByTestId("editor-contenteditable");

    expect(screen.getByTestId("formatting-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("formatting-bold-btn")).toBeInTheDocument();
    expect(screen.getByTestId("formatting-italic-btn")).toBeInTheDocument();
    expect(
      screen.getByTestId("formatting-strikethrough-btn")
    ).toBeInTheDocument();
    expect(screen.getByTestId("formatting-highlight-btn")).toBeInTheDocument();
  });

  it("applies highlight format when highlight button is clicked on text selection", async () => {
    const writeSpy = vi.spyOn(fileService, "writeMarkdownFile");
    fileService.setMockFileContent("highlight-test.md", "Simple text");

    render(<EditorPane filename="highlight-test.md" />);

    const editor = await screen.findByTestId("editor-contenteditable");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lexicalEditor = (editor as any).__lexicalEditor;
    expect(lexicalEditor).toBeDefined();

    // Select text in Lexical editor
    act(() => {
      lexicalEditor.update(() => {
        const root = $getRoot();
        const firstChild = root.getFirstChild();
        const textNode = (firstChild as any)?.getFirstChild();
        textNode?.select(0, 6);
      });
    });

    const highlightBtn = screen.getByTestId("formatting-highlight-btn");
    fireEvent.mouseDown(highlightBtn);
    fireEvent.click(highlightBtn);

    // Save with Ctrl+S
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    await waitFor(() => {
      expect(writeSpy).toHaveBeenCalled();
      const lastSaved = writeSpy.mock.calls[writeSpy.mock.calls.length - 1][1];
      expect(lastSaved).toContain("==Simple==");
    });
  });

  it("extracts tags in onTasksChange and triggers onSelectTag when clicking hashtag node", async () => {
    const handleTasksChange = vi.fn();
    const handleSelectTag = vi.fn();

    fileService.setMockFileContent(
      "tags-note.md",
      "- [ ] Fix security vulnerability #urgent #security\n- [ ] Update readme"
    );

    render(
      <EditorPane
        filename="tags-note.md"
        onTasksChange={handleTasksChange}
        onSelectTag={handleSelectTag}
      />
    );

    const editor = await screen.findByTestId("editor-contenteditable");
    expect(editor).toBeInTheDocument();

    await waitFor(() => {
      expect(handleTasksChange).toHaveBeenCalled();
      const lastEmitted =
        handleTasksChange.mock.calls[
          handleTasksChange.mock.calls.length - 1
        ][0];
      expect(lastEmitted).toHaveLength(2);
      expect(lastEmitted[0].tags).toEqual(["#urgent", "#security"]);
      expect(lastEmitted[1].tags).toEqual([]);
    });

    // Verify hashtag elements rendered in editor DOM
    await waitFor(() => {
      const hashtagPill = editor.querySelector(".lexical-hashtag");
      expect(hashtagPill).not.toBeNull();
      expect(hashtagPill?.textContent).toBe("#urgent");
    });

    const hashtagPill = editor.querySelector(".lexical-hashtag");
    if (hashtagPill) {
      fireEvent.click(hashtagPill);
      expect(handleSelectTag).toHaveBeenCalledWith("#urgent");
    }
  });
});
