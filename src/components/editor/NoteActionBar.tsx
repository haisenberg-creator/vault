import React, { useState, useEffect, useCallback, useContext } from "react";
import { LexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  TextFormatType,
} from "lexical";
import { Columns2 } from "lucide-react";
import { TaskState } from "../sidebar/TaskDashboardSidebar";

export interface NoteActionBarProps {
  onAddTask?: () => void;
  onChangeTaskStatus?: (status: TaskState) => void;
  onApplyPrefix?: (prefix: string) => void;
  onInsertPriorityTemplate?: () => void;
  onInsertPriorityHeader?: (priority: "Urgent" | "High" | "Low") => void;
  onFormatText?: (format: TextFormatType) => void;
  activeFormats?: {
    isBold?: boolean;
    isItalic?: boolean;
    isStrikethrough?: boolean;
    isHighlight?: boolean;
  };
  onToggleSplitView?: () => void;
  isSplitView?: boolean;
  onCloseSplitPane?: () => void;
}

const MARKER_STYLES = [
  { label: "- Dash Bullet", prefix: "- " },
  { label: "+ Plus Bullet", prefix: "+ " },
  { label: "* Star Bullet", prefix: "* " },
  { label: "• Solid Dot", prefix: "• " },
  { label: "◦ Open Circle", prefix: "◦ " },
  { label: "▪ Square Bullet", prefix: "▪ " },
  { label: "→ Arrow Pointer", prefix: "→ " },
  { label: "★ Star Symbol", prefix: "★ " },
  { label: "1. Numbered List", prefix: "1. " },
];

export const NoteActionBar: React.FC<NoteActionBarProps> = ({
  onAddTask,
  onChangeTaskStatus,
  onApplyPrefix,
  onInsertPriorityTemplate,
  onInsertPriorityHeader,
  onFormatText,
  activeFormats,
  onToggleSplitView,
  isSplitView,
  onCloseSplitPane,
}) => {
  const [showMarkerDropdown, setShowMarkerDropdown] = useState(false);

  // Safely check if rendered inside a LexicalComposer
  const composerContext = useContext(LexicalComposerContext);
  const editor = composerContext ? composerContext[0] : null;

  const [isBold, setIsBold] = useState(activeFormats?.isBold ?? false);
  const [isItalic, setIsItalic] = useState(activeFormats?.isItalic ?? false);
  const [isStrikethrough, setIsStrikethrough] = useState(
    activeFormats?.isStrikethrough ?? false
  );
  const [isHighlight, setIsHighlight] = useState(
    activeFormats?.isHighlight ?? false
  );

  const updateToolbar = useCallback(() => {
    if (!editor) return;
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
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
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
    if (editor) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    }
    onFormatText?.(format);
  };

  return (
    <div
      data-testid="note-action-bar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        backgroundColor: "var(--rose-bg-overlay)",
        borderBottom: "1px solid rgba(110, 106, 134, 0.25)",
        flexWrap: "wrap",
        userSelect: "none",
      }}
    >
      {/* Quick Add Task Button */}
      <button
        data-testid="note-action-add-task"
        onClick={onAddTask}
        className="tactile-btn"
        style={{
          padding: "4px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--rose-pink)",
          backgroundColor: "rgba(235, 111, 146, 0.15)",
          color: "var(--rose-pink)",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>+</span>
        <span>New Task</span>
      </button>

      {/* Priority Template Button */}
      <button
        data-testid="note-action-priority-template"
        onClick={onInsertPriorityTemplate}
        className="tactile-btn"
        style={{
          padding: "4px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--rose-gold)",
          backgroundColor: "rgba(246, 193, 119, 0.15)",
          color: "var(--rose-gold)",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>⚡</span>
        <span>Priority Template</span>
      </button>

      <div
        style={{
          height: "16px",
          width: "1px",
          backgroundColor: "rgba(110, 106, 134, 0.3)",
        }}
      />

      {/* Priority Header Buttons with PRIORITY: label */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          data-testid="note-action-priority-label"
          style={{
            fontSize: "10px",
            color: "var(--rose-subtle)",
            fontWeight: 600,
          }}
        >
          PRIORITY:
        </span>
        <button
          data-testid="note-action-priority-urgent"
          onClick={() => onInsertPriorityHeader?.("Urgent")}
          className="tactile-btn"
          style={{
            padding: "3px 7px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--rose-pink)",
            backgroundColor: "rgba(235, 111, 146, 0.15)",
            color: "var(--rose-love)",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Urgent
        </button>
        <button
          data-testid="note-action-priority-high"
          onClick={() => onInsertPriorityHeader?.("High")}
          className="tactile-btn"
          style={{
            padding: "3px 7px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--rose-gold)",
            backgroundColor: "rgba(246, 193, 119, 0.15)",
            color: "var(--rose-gold)",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          High
        </button>
        <button
          data-testid="note-action-priority-low"
          onClick={() => onInsertPriorityHeader?.("Low")}
          className="tactile-btn"
          style={{
            padding: "3px 7px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--rose-foam)",
            backgroundColor: "rgba(156, 207, 216, 0.15)",
            color: "var(--rose-foam)",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Low
        </button>
      </div>

      <div
        style={{
          height: "16px",
          width: "1px",
          backgroundColor: "rgba(110, 106, 134, 0.3)",
        }}
      />

      {/* Task Status Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            fontSize: "10px",
            color: "var(--rose-subtle)",
            fontWeight: 600,
          }}
        >
          STATUS:
        </span>
        {(["in_progress", "blocked", "completed"] as const).map((st) => (
          <button
            key={st}
            data-testid={`note-status-${st}`}
            onClick={() => onChangeTaskStatus?.(st)}
            className="tactile-btn"
            style={{
              padding: "3px 7px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(110, 106, 134, 0.25)",
              backgroundColor: "var(--rose-bg-surface)",
              color:
                st === "in_progress"
                  ? "var(--rose-gold)"
                  : st === "blocked"
                    ? "var(--rose-love)"
                    : "var(--rose-foam)",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {st === "in_progress"
              ? "In Progress"
              : st === "blocked"
                ? "Blocked"
                : "Done"}
          </button>
        ))}
      </div>

      <div
        style={{
          height: "16px",
          width: "1px",
          backgroundColor: "rgba(110, 106, 134, 0.3)",
        }}
      />

      {/* Inline Text Formatting Controls */}
      <div
        data-testid="formatting-toolbar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
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
            width: "24px",
            height: "22px",
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
            fontSize: "11px",
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
            width: "24px",
            height: "22px",
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
            fontSize: "11px",
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
            width: "24px",
            height: "22px",
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
            fontSize: "11px",
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
            padding: "0 5px",
            height: "22px",
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
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>==</span>
          <span style={{ fontSize: "9px" }}>HL</span>
          <span>==</span>
        </button>
      </div>

      <div
        style={{
          height: "16px",
          width: "1px",
          backgroundColor: "rgba(110, 106, 134, 0.3)",
        }}
      />

      {/* Marker / List Style Picker Dropdown */}
      <div style={{ position: "relative" }}>
        <button
          data-testid="note-action-marker-picker"
          onClick={() => setShowMarkerDropdown((prev) => !prev)}
          className="tactile-btn"
          style={{
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(110, 106, 134, 0.3)",
            backgroundColor: "var(--rose-bg-surface)",
            color: "var(--rose-text)",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>Style / Marker ▾</span>
        </button>

        {showMarkerDropdown && (
          <div
            data-testid="marker-dropdown-menu"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              width: "180px",
              maxHeight: "240px",
              overflowY: "auto",
              backgroundColor: "var(--rose-bg-surface)",
              border: "1px solid var(--rose-border-color)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--rose-shadow)",
              zIndex: 100,
              padding: "4px",
            }}
          >
            {MARKER_STYLES.map((style) => (
              <button
                key={style.prefix}
                data-testid={`marker-option-${style.prefix.trim()}`}
                onClick={() => {
                  onApplyPrefix?.(style.prefix);
                  setShowMarkerDropdown(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--rose-text)",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--rose-bg-overlay)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Split View Toggle & Close Actions */}
      {onToggleSplitView && (
        <button
          data-testid="note-action-split-right"
          className="tactile-btn"
          title="Split Right (Ctrl+\)"
          onClick={onToggleSplitView}
          style={{
            padding: "3px 7px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(156, 207, 216, 0.4)",
            backgroundColor: isSplitView
              ? "rgba(156, 207, 216, 0.25)"
              : "rgba(156, 207, 216, 0.12)",
            color: "var(--rose-foam)",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Columns2 size={12} />
          <span>{isSplitView ? "Split Active" : "Split Right"}</span>
        </button>
      )}

      {onCloseSplitPane && (
        <button
          data-testid="close-split-pane-btn"
          className="tactile-btn"
          title="Close Split Pane"
          onClick={onCloseSplitPane}
          style={{
            padding: "3px 7px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(235, 111, 146, 0.4)",
            backgroundColor: "rgba(235, 111, 146, 0.15)",
            color: "var(--rose-love)",
            fontSize: "10px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          ✕ Close Pane
        </button>
      )}
    </div>
  );
};
