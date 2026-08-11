import React, { useState, useEffect, useRef, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code-core";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
  EditorState,
  $nodesOfType,
  $getNodeByKey,
} from "lexical";

import {
  readMarkdownFile,
  writeMarkdownFile,
} from "../../services/fileService";
import { theme } from "./LexicalEditorTheme";
import {
  ChecklistNode,
  $isChecklistNode,
  getNextTaskState,
  formatTaskState,
} from "./ChecklistNode";
import { ALL_TRANSFORMERS } from "./checklistTransformer";
import { TaskItem, TaskState } from "../sidebar/TaskDashboardSidebar";
import { NoteActionBar } from "./NoteActionBar";

export interface EditorPaneProps {
  filename?: string;
  onTasksChange?: (tasks: TaskItem[]) => void;
  onRegisterToggleTask?: (toggleFn: (nodeKey: string) => void) => void;
}

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  ChecklistNode,
];

// Plugin to extract ChecklistNode tasks from Lexical AST
function TaskExtractorPlugin({
  filename,
  onTasksChange,
}: {
  filename: string;
  onTasksChange?: (tasks: TaskItem[]) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onTasksChange) return;

    const extractAndEmit = () => {
      editor.getEditorState().read(() => {
        const checklistNodes = $nodesOfType(ChecklistNode);
        const extracted: TaskItem[] = checklistNodes.map((node) => {
          const key = node.getKey();
          const parent = node.getParent();
          const fullText = parent ? parent.getTextContent() : "";
          const title =
            fullText.replace(/\[([ x\->])\]/gi, "").trim() || "Untitled Task";

          return {
            id: key,
            nodeKey: key,
            title,
            sourceFile: filename,
            state: node.getState(),
          };
        });
        onTasksChange(extracted);
      });
    };

    extractAndEmit();

    return editor.registerUpdateListener(() => {
      extractAndEmit();
    });
  }, [editor, filename, onTasksChange]);

  return null;
}

// Plugin to expose node toggle action to parent components
function TaskToggleHandlerPlugin({
  onRegisterToggleTask,
}: {
  onRegisterToggleTask?: (toggleFn: (nodeKey: string) => void) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onRegisterToggleTask) return;

    onRegisterToggleTask((nodeKey: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isChecklistNode(node)) {
          const nextState = getNextTaskState(node.getState());
          node.setState(nextState);
        }
      });
    });
  }, [editor, onRegisterToggleTask]);

  return null;
}

// Helper plugin to import markdown when external file content changes
function MarkdownSyncPlugin({
  initialContent,
  onMarkdownChange,
}: {
  initialContent: string;
  onMarkdownChange: (markdown: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const lastLoadedContentRef = useRef<string | null>(null);

  // Sync external markdown content into Lexical editor instance
  useEffect(() => {
    if (lastLoadedContentRef.current !== initialContent) {
      lastLoadedContentRef.current = initialContent;
      editor.update(() => {
        $convertFromMarkdownString(initialContent, ALL_TRANSFORMERS);
      });
    }
  }, [editor, initialContent]);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
        if (markdown !== lastLoadedContentRef.current) {
          lastLoadedContentRef.current = markdown;
          onMarkdownChange(markdown);
        }
      });
    },
    [onMarkdownChange]
  );

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />;
}

// Helper plugin for Ctrl+S / Cmd+S keyboard shortcut
function KeyboardSavePlugin({ onSave }: { onSave: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "s"
        ) {
          event.preventDefault();
          onSave();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onSave]);

  return null;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  filename = "workspace-note.md",
  onTasksChange,
  onRegisterToggleTask,
}) => {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeFilenameRef = useRef(filename);
  const currentContentRef = useRef(markdownContent);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  currentContentRef.current = markdownContent;

  // Load document on mount or when filename changes
  useEffect(() => {
    activeFilenameRef.current = filename;
    let isMounted = true;
    setIsLoading(true);
    setSaveStatus("idle");

    readMarkdownFile(filename)
      .then((data) => {
        if (isMounted) {
          setMarkdownContent(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || "Failed to load document");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [filename]);

  const triggerSave = useCallback(async (textToSave: string) => {
    setSaveStatus("saving");
    try {
      await writeMarkdownFile(activeFilenameRef.current, textToSave);
      setSaveStatus("saved");
      setErrorMessage(null);
    } catch (err: unknown) {
      setSaveStatus("error");
      const msg = err instanceof Error ? err.message : "Error saving file";
      setErrorMessage(msg);
    }
  }, []);

  const handleMarkdownChange = useCallback(
    (newMarkdown: string) => {
      setMarkdownContent(newMarkdown);
      setSaveStatus("idle");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        triggerSave(newMarkdown);
      }, 500);
    },
    [triggerSave]
  );

  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    triggerSave(currentContentRef.current);
  }, [triggerSave]);

  // Helper to compute task stats from markdown text
  const computeTaskStats = (text: string) => {
    const totalMatches = text.match(/\[([ x\->])\]/gi) || [];
    const completedMatches = text.match(/\[x\]/gi) || [];
    return {
      total: totalMatches.length,
      completed: completedMatches.length,
    };
  };

  const taskStats = computeTaskStats(markdownContent);

  const statusBadgeColor = {
    idle: "var(--rose-subtle)",
    saving: "var(--rose-gold)",
    saved: "var(--rose-foam)",
    error: "var(--rose-love)",
  }[saveStatus];

  const statusText = {
    idle: "Ready",
    saving: "Saving...",
    saved: "Saved",
    error: "Save Error",
  }[saveStatus];

  const initialConfig = {
    namespace: "ChecklistLexicalEditor",
    theme,
    nodes: EDITOR_NODES,
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  const handleActionBarAddTask = useCallback(() => {
    const newTaskLine =
      currentContentRef.current.endsWith("\n") || !currentContentRef.current
        ? "- [ ] New task"
        : "\n- [ ] New task";
    const updated = currentContentRef.current + newTaskLine;
    handleMarkdownChange(updated);
  }, [handleMarkdownChange]);

  const handleActionBarChangeStatus = useCallback(
    (status: TaskState) => {
      const syntax = formatTaskState(status);
      const lineToAdd =
        currentContentRef.current.endsWith("\n") || !currentContentRef.current
          ? `- ${syntax} Task item`
          : `\n- ${syntax} Task item`;
      const updated = currentContentRef.current + lineToAdd;
      handleMarkdownChange(updated);
    },
    [handleMarkdownChange]
  );

  const handleActionBarApplyPrefix = useCallback(
    (prefix: string) => {
      const lineToAdd =
        currentContentRef.current.endsWith("\n") || !currentContentRef.current
          ? `${prefix}New list item`
          : `\n${prefix}New list item`;
      const updated = currentContentRef.current + lineToAdd;
      handleMarkdownChange(updated);
    },
    [handleMarkdownChange]
  );

  return (
    <main
      style={{
        flex: 1,
        height: "100%",
        backgroundColor: "var(--rose-bg-base)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Editor Header / Status Bar */}
      <div
        style={{
          height: "44px",
          padding: "0 20px",
          borderBottom: "1px solid rgba(110, 106, 134, 0.2)",
          backgroundColor: "var(--rose-bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--rose-rose)" }}
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--rose-rose)",
            }}
          >
            {filename}
          </span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: "rgba(156, 207, 216, 0.15)",
              color: "var(--rose-foam)",
            }}
          >
            Lexical Markdown
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "11px",
            color: "var(--rose-subtle)",
          }}
        >
          <span>
            {taskStats.total} Tasks ({taskStats.completed} Completed)
          </span>
          <span
            data-testid="save-status-badge"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: statusBadgeColor,
                transition: "background-color 200ms ease",
              }}
            />
            {statusText}
          </span>
        </div>
      </div>

      {/* Note Action Toolbar */}
      <NoteActionBar
        onAddTask={handleActionBarAddTask}
        onChangeTaskStatus={handleActionBarChangeStatus}
        onApplyPrefix={handleActionBarApplyPrefix}
      />

      {/* Editor Content Area */}
      <div
        style={{
          flex: 1,
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {errorMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              backgroundColor: "rgba(235, 111, 146, 0.15)",
              color: "var(--rose-love)",
              fontSize: "12px",
              marginBottom: "12px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div
            style={{
              color: "var(--rose-subtle)",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              padding: "20px 0",
            }}
          >
            Loading document...
          </div>
        ) : (
          <LexicalComposer initialConfig={initialConfig}>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{ flex: 1, position: "relative", overflowY: "auto" }}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      data-testid="editor-contenteditable"
                      aria-label={`Editor for ${filename}`}
                      className="lexical-editor-root"
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </div>
              <HistoryPlugin />
              <TaskExtractorPlugin
                filename={filename}
                onTasksChange={onTasksChange}
              />
              <TaskToggleHandlerPlugin
                onRegisterToggleTask={onRegisterToggleTask}
              />
              <MarkdownSyncPlugin
                initialContent={markdownContent}
                onMarkdownChange={handleMarkdownChange}
              />
              <KeyboardSavePlugin onSave={handleManualSave} />
            </div>
          </LexicalComposer>
        )}
      </div>
    </main>
  );
};

export default EditorPane;
