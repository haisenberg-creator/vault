import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { FormattingToolbar } from "../FormattingToolbar";
import { theme } from "../LexicalEditorTheme";

function TestEditor() {
  const initialConfig = {
    namespace: "FormattingToolbarTest",
    theme,
    onError: (error: Error) => {
      throw error;
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <FormattingToolbar />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            data-testid="test-contenteditable"
            className="lexical-editor-root"
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}

describe("FormattingToolbar Component", () => {
  it("renders all four formatting buttons (Bold, Italic, Strikethrough, Highlight)", () => {
    render(<TestEditor />);

    expect(screen.getByTestId("formatting-bold-btn")).toBeInTheDocument();
    expect(screen.getByTestId("formatting-italic-btn")).toBeInTheDocument();
    expect(
      screen.getByTestId("formatting-strikethrough-btn")
    ).toBeInTheDocument();
    expect(screen.getByTestId("formatting-highlight-btn")).toBeInTheDocument();
  });

  it("handles clicking Bold button without errors", () => {
    render(<TestEditor />);
    const boldBtn = screen.getByTestId("formatting-bold-btn");
    fireEvent.mouseDown(boldBtn);
    fireEvent.click(boldBtn);
  });

  it("handles clicking Italic button without errors", () => {
    render(<TestEditor />);
    const italicBtn = screen.getByTestId("formatting-italic-btn");
    fireEvent.mouseDown(italicBtn);
    fireEvent.click(italicBtn);
  });

  it("handles clicking Strikethrough button without errors", () => {
    render(<TestEditor />);
    const strikeBtn = screen.getByTestId("formatting-strikethrough-btn");
    fireEvent.mouseDown(strikeBtn);
    fireEvent.click(strikeBtn);
  });

  it("handles clicking Highlight button without errors", () => {
    render(<TestEditor />);
    const highlightBtn = screen.getByTestId("formatting-highlight-btn");
    fireEvent.mouseDown(highlightBtn);
    fireEvent.click(highlightBtn);
  });
});
