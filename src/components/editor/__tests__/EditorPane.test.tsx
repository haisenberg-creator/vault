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
});
