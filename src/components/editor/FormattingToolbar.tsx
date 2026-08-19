import React, { useState, useEffect, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  TextFormatType,
} from "lexical";

export interface FormattingToolbarProps {
  className?: string;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  className,
}) => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsHighlight(selection.hasFormat("highlight"));
    } else {
      setIsBold(false);
      setIsItalic(false);
      setIsStrikethrough(false);
      setIsHighlight(false);
    }
  }, []);

  useEffect(() => {
    const unregisterUpdate = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }
    );

    const unregisterSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterUpdate();
      unregisterSelection();
    };
  }, [editor, updateToolbar]);

  const handleFormat = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  return (
    <div
      data-testid="formatting-toolbar"
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        backgroundColor: "rgba(30, 27, 45, 0.6)",
        borderBottom: "1px solid rgba(110, 106, 134, 0.2)",
        userSelect: "none",
      }}
    >
      {/* Bold Button */}
      <button
        type="button"
        data-testid="formatting-bold-btn"
        title="Bold (Ctrl+B)"
        aria-label="Format Bold"
        aria-pressed={isBold}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleFormat("bold")}
        className="tactile-btn"
        style={{
          width: "26px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          border: isBold
            ? "1px solid var(--rose-pink)"
            : "1px solid rgba(110, 106, 134, 0.25)",
          backgroundColor: isBold
            ? "rgba(235, 111, 146, 0.25)"
            : "var(--rose-bg-surface)",
          color: isBold ? "var(--rose-pink)" : "var(--rose-text)",
          fontWeight: 800,
          fontSize: "12px",
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        B
      </button>

      {/* Italic Button */}
      <button
        type="button"
        data-testid="formatting-italic-btn"
        title="Italic (Ctrl+I)"
        aria-label="Format Italic"
        aria-pressed={isItalic}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleFormat("italic")}
        className="tactile-btn"
        style={{
          width: "26px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          border: isItalic
            ? "1px solid var(--rose-gold)"
            : "1px solid rgba(110, 106, 134, 0.25)",
          backgroundColor: isItalic
            ? "rgba(246, 193, 119, 0.25)"
            : "var(--rose-bg-surface)",
          color: isItalic ? "var(--rose-gold)" : "var(--rose-text)",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: "12px",
          fontFamily: "serif",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        I
      </button>

      {/* Strikethrough Button */}
      <button
        type="button"
        data-testid="formatting-strikethrough-btn"
        title="Strikethrough"
        aria-label="Format Strikethrough"
        aria-pressed={isStrikethrough}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleFormat("strikethrough")}
        className="tactile-btn"
        style={{
          width: "26px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          border: isStrikethrough
            ? "1px solid var(--rose-love)"
            : "1px solid rgba(110, 106, 134, 0.25)",
          backgroundColor: isStrikethrough
            ? "rgba(235, 111, 146, 0.25)"
            : "var(--rose-bg-surface)",
          color: isStrikethrough ? "var(--rose-love)" : "var(--rose-text)",
          textDecoration: "line-through",
          fontWeight: 600,
          fontSize: "12px",
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        S
      </button>

      {/* Highlight Button */}
      <button
        type="button"
        data-testid="formatting-highlight-btn"
        title="Highlight (==text==)"
        aria-label="Format Highlight"
        aria-pressed={isHighlight}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleFormat("highlight")}
        className="tactile-btn"
        style={{
          padding: "0 6px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          borderRadius: "var(--radius-sm)",
          border: isHighlight
            ? "1px solid var(--rose-gold)"
            : "1px solid rgba(110, 106, 134, 0.25)",
          backgroundColor: isHighlight
            ? "rgba(246, 193, 119, 0.3)"
            : "rgba(246, 193, 119, 0.1)",
          color: "var(--rose-gold)",
          fontWeight: 700,
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <span>==</span>
        <span style={{ fontSize: "10px" }}>HL</span>
        <span>==</span>
      </button>
    </div>
  );
};
