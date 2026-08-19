import React, { useState, useEffect, useRef, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
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
  KEY_ENTER_COMMAND,
  KEY_BACKSPACE_COMMAND,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  COMMAND_PRIORITY_HIGH,
  EditorState,
  $nodesOfType,
  $getNodeByKey,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $isTextNode,
  $isElementNode,
  TextNode,
  LexicalNode,
} from "lexical";
import { $isListItemNode, $isListNode } from "@lexical/list";

import {
  readMarkdownFile,
  writeMarkdownFile,
  formatShortPath,
} from "../../services/fileService";
import { theme } from "./LexicalEditorTheme";
import {
  ChecklistNode,
  $isChecklistNode,
  $createChecklistNode,
  getNextTaskState,
  formatTaskState,
  ActiveFileContext,
} from "./ChecklistNode";
import {
  CustomListItemNode,
  $createCustomListItemNode,
  $isCustomListItemNode,
} from "./CustomListItemNode";
import { ALL_TRANSFORMERS } from "./checklistTransformer";
import { TaskItem, TaskState } from "../sidebar/TaskDashboardSidebar";
import { NoteActionBar } from "./NoteActionBar";
import { FormattingToolbar } from "./FormattingToolbar";

export interface EditorPaneProps {
  filename?: string;
  workspaceDir?: string;
  onTasksChange?: (tasks: TaskItem[]) => void;
  onRegisterToggleTask?: (toggleFn: (nodeKey: string) => void) => void;
  onRegisterRemoveTask?: (removeFn: (taskTitle: string) => boolean) => void;
}

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CustomListItemNode,
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
        const checklistNodes: ChecklistNode[] = [];
        const traverse = (node: LexicalNode) => {
          if ($isChecklistNode(node)) {
            checklistNodes.push(node);
          }
          if ($isElementNode(node)) {
            for (const child of node.getChildren()) {
              traverse(child);
            }
          }
        };
        traverse($getRoot());

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

// Plugin to expose node removal action to parent components
function TaskRemoveHandlerPlugin({
  onRegisterRemoveTask,
}: {
  onRegisterRemoveTask?: (removeFn: (taskTitle: string) => boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onRegisterRemoveTask) return;

    onRegisterRemoveTask((taskTitle: string) => {
      let removed = false;
      editor.update(() => {
        const checklistNodes = $nodesOfType(ChecklistNode);
        for (const node of checklistNodes) {
          const parent = node.getParent();
          if (parent) {
            const fullText = parent.getTextContent();
            const title = fullText.replace(/\[([ x\->])\]/gi, "").trim();
            if (
              title === taskTitle ||
              taskTitle.includes(title) ||
              title.includes(taskTitle)
            ) {
              parent.remove();
              removed = true;
              break;
            }
          }
        }
      });
      return removed;
    });
  }, [editor, onRegisterRemoveTask]);

  return null;
}

// Plugin to handle inserting a new task line from toolbar or changing active task status with focus
function TaskInsertHandlerPlugin({
  onRegisterAddTask,
  onRegisterChangeStatus,
}: {
  onRegisterAddTask?: (addTaskFn: () => void) => void;
  onRegisterChangeStatus?: (
    changeStatusFn: (status: TaskState) => void
  ) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onRegisterAddTask) return;

    onRegisterAddTask(() => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const checklistNode = $createChecklistNode("open");
        const textNode = $createTextNode(" ");
        paragraph.append(checklistNode, textNode);

        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const blockNode = $isElementNode(anchorNode)
            ? anchorNode
            : anchorNode.getParent();
          if (blockNode) {
            blockNode.insertAfter(paragraph);
          } else {
            root.append(paragraph);
          }
        } else {
          root.append(paragraph);
        }

        textNode.select(1, 1);
      });
      editor.focus();
    });
  }, [editor, onRegisterAddTask]);

  useEffect(() => {
    if (!onRegisterChangeStatus) return;

    onRegisterChangeStatus((status: TaskState) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          let curr: LexicalNode | null = anchorNode;
          let existingChecklistNode: ChecklistNode | null = null;

          while (curr) {
            if ($isChecklistNode(curr)) {
              existingChecklistNode = curr;
              break;
            }
            if ($isElementNode(curr)) {
              const checklistChild = curr.getChildren().find($isChecklistNode);
              if (checklistChild && $isChecklistNode(checklistChild)) {
                existingChecklistNode = checklistChild;
                break;
              }
            }
            curr = curr.getParent();
          }

          if (existingChecklistNode) {
            existingChecklistNode.setState(status);
            return;
          }

          const blockNode = $isElementNode(anchorNode)
            ? anchorNode
            : anchorNode.getParent();
          const paragraph = $createParagraphNode();
          const checklistNode = $createChecklistNode(status);
          const textNode = $createTextNode(" ");
          paragraph.append(checklistNode, textNode);

          if (blockNode) {
            blockNode.insertAfter(paragraph);
          } else {
            $getRoot().append(paragraph);
          }
          textNode.select(1, 1);
        } else {
          const root = $getRoot();
          const paragraph = $createParagraphNode();
          const checklistNode = $createChecklistNode(status);
          const textNode = $createTextNode(" ");
          paragraph.append(checklistNode, textNode);
          root.append(paragraph);
          textNode.select(1, 1);
        }
      });
      editor.focus();
    });
  }, [editor, onRegisterChangeStatus]);

  return null;
}

// Plugin to handle Enter and Backspace keys on task lines
function TaskKeyboardPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const blockNode = $isElementNode(anchorNode)
          ? anchorNode
          : anchorNode.getParent();
        if (!blockNode) return false;

        const children = blockNode.getChildren();
        const checklistNode = children.find($isChecklistNode);
        if (!checklistNode) return false;

        if (event) {
          event.preventDefault();
        }

        const rawText = blockNode.getTextContent();
        const cleanText = rawText.replace(/\[([ x\->])\]/gi, "").trim();

        if (cleanText === "") {
          // Empty task line -> convert to standard empty paragraph (escape list)
          blockNode.clear();
          const emptyTextNode = $createTextNode("");
          blockNode.append(emptyTextNode);
          emptyTextNode.select();
          return true;
        } else {
          // Non-empty task line -> insert new task line after
          const newParagraph = $createParagraphNode();
          const newChecklistNode = $createChecklistNode("open");

          const anchorOffset = selection.anchor.offset;
          let remainingText = "";
          if (anchorNode instanceof TextNode) {
            const fullText = anchorNode.getTextContent();
            if (anchorOffset < fullText.length) {
              remainingText = fullText.slice(anchorOffset);
              anchorNode.setTextContent(fullText.slice(0, anchorOffset));
            }
          }

          const newTextNode = $createTextNode(" " + remainingText);
          newParagraph.append(newChecklistNode, newTextNode);
          blockNode.insertAfter(newParagraph);
          newTextNode.select(1, 1);
          return true;
        }
      },
      COMMAND_PRIORITY_HIGH
    );

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        let targetListItem: ListItemNode | null = null;
        let curr: LexicalNode | null = anchorNode;
        while (curr) {
          if ($isListItemNode(curr)) {
            targetListItem = curr;
            break;
          }
          curr = curr.getParent();
        }

        if (targetListItem) {
          const rawText = targetListItem.getTextContent();
          const pureText = rawText.replace(/\[([ x\->])\]/gi, "").trim();

          if (selection.anchor.offset === 0 || pureText === "") {
            const parentList = targetListItem.getParent();
            if ($isListNode(parentList)) {
              event?.preventDefault();
              const p = $createParagraphNode();
              if (pureText) {
                p.append($createTextNode(pureText));
              }
              targetListItem.replace(p);
              if (parentList.getChildrenSize() === 0) {
                parentList.remove();
              }
              p.select();
              return true;
            }
          }
        } else {
          const blockNode = $isElementNode(anchorNode)
            ? anchorNode
            : anchorNode.getParent();
          if (blockNode) {
            const children = blockNode.getChildren();
            const checklistChild = children.find($isChecklistNode);
            if (checklistChild && selection.anchor.offset <= 1) {
              const rawText = blockNode.getTextContent();
              const pureText = rawText.replace(/\[([ x\->])\]/gi, "").trim();
              if (pureText === "") {
                event?.preventDefault();
                blockNode.clear();
                const emptyTextNode = $createTextNode("");
                blockNode.append(emptyTextNode);
                emptyTextNode.select();
                return true;
              }
            }
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      unregisterEnter();
      unregisterBackspace();
    };
  }, [editor]);

  return null;
}

// Plugin to decorate H2 priority headers with data-priority attributes
function PriorityHeaderPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const updateHeaderAttributes = () => {
      editor.getEditorState().read(() => {
        const headingNodes = $nodesOfType(HeadingNode);
        for (const node of headingNodes) {
          if (node.getTag() === "h2") {
            const dom = editor.getElementByKey(node.getKey());
            if (dom) {
              const text = node.getTextContent().trim().toLowerCase();
              if (text.includes("urgent")) {
                dom.setAttribute("data-priority", "urgent");
              } else if (text.includes("high")) {
                dom.setAttribute("data-priority", "high");
              } else if (text.includes("low")) {
                dom.setAttribute("data-priority", "low");
              } else {
                dom.removeAttribute("data-priority");
              }
            }
          }
        }
      });
    };

    updateHeaderAttributes();
    return editor.registerUpdateListener(() => {
      updateHeaderAttributes();
    });
  }, [editor]);

  return null;
}

// Plugin to handle dragging and dropping tasks onto priority headers or document locations
function TaskDragDropPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterDragOver = editor.registerCommand(
      DRAGOVER_COMMAND,
      (event: DragEvent) => {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "move";
        }

        if (event.target && "closest" in (event.target as object)) {
          const priorityHeader = (event.target as HTMLElement).closest(
            "[data-priority]"
          );
          const existingDragOver = document.querySelector(".drag-over");
          if (existingDragOver && existingDragOver !== priorityHeader) {
            existingDragOver.classList.remove("drag-over");
          }
          if (priorityHeader) {
            priorityHeader.classList.add("drag-over");
          }
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const removeDragOverStyles = () => {
      const existingDragOver = document.querySelectorAll(".drag-over");
      existingDragOver.forEach((el) => el.classList.remove("drag-over"));
    };

    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        event.preventDefault();
        removeDragOverStyles();

        const dataTransfer = event.dataTransfer;
        if (!dataTransfer) return false;

        const taskKey = dataTransfer.getData("application/x-lexical-task-key");
        const jsonRaw = dataTransfer.getData("application/json");
        const textRaw = dataTransfer.getData("text/plain");

        let parsedKey = taskKey;
        let taskTitle = "";
        let taskState: TaskState = "open";

        if (jsonRaw) {
          try {
            const parsed = JSON.parse(jsonRaw);
            if (parsed.nodeKey && !parsedKey) {
              parsedKey = parsed.nodeKey;
            }
            if (parsed.taskTitle) {
              taskTitle = parsed.taskTitle;
            }
            if (parsed.state) {
              taskState = parsed.state;
            }
          } catch {
            // Ignore JSON parse errors
          }
        }

        if (!taskTitle && textRaw && textRaw.startsWith("task-drag:")) {
          taskTitle = textRaw.replace(/^task-drag:/, "").trim();
        }

        if (!parsedKey && !taskTitle) {
          return false;
        }

        editor.update(() => {
          let targetNode: LexicalNode | null = null;

          if (
            event.target &&
            ("nodeType" in (event.target as object) ||
              event.target instanceof Node)
          ) {
            const nearestNode = $getNearestNodeFromDOMNode(
              event.target as Node
            );
            if (nearestNode) {
              targetNode = $isElementNode(nearestNode)
                ? nearestNode
                : nearestNode.getParent();
            }
          }

          if (!targetNode) {
            targetNode = $getRoot().getLastChild();
          }

          if (!targetNode) return;

          if (parsedKey) {
            const checklistNode = $getNodeByKey(parsedKey);
            if (checklistNode && $isChecklistNode(checklistNode)) {
              const draggedBlock = checklistNode.getParent();
              if (draggedBlock) {
                // Check if target is draggedBlock, checklistNode, or any child/descendant of draggedBlock
                let isSelf =
                  targetNode.getKey() === draggedBlock.getKey() ||
                  targetNode.getKey() === checklistNode.getKey();

                if (!isSelf) {
                  let curr: LexicalNode | null = targetNode;
                  while (curr) {
                    if (curr.getKey() === draggedBlock.getKey()) {
                      isSelf = true;
                      break;
                    }
                    curr = curr.getParent();
                  }
                }

                if (isSelf) {
                  // Dropping on self is a safe no-op
                  return;
                }

                // Check if target is the immediately previous sibling (leaves position unchanged)
                const prevSibling = draggedBlock.getPreviousSibling();
                if (
                  prevSibling &&
                  prevSibling.getKey() === targetNode.getKey()
                ) {
                  // Dropping after previous sibling is a safe no-op
                  return;
                }

                // Check if target is parent list and draggedBlock is already inside it
                if ($isListNode(targetNode)) {
                  const sourceParent = draggedBlock.getParent();
                  if (
                    sourceParent &&
                    sourceParent.getKey() === targetNode.getKey()
                  ) {
                    return;
                  }
                }

                // Valid cross-position move
                const sourceParent = draggedBlock.getParent();
                targetNode.insertAfter(draggedBlock);

                // Clean up empty source parent list if needed
                if (
                  sourceParent &&
                  $isListNode(sourceParent) &&
                  sourceParent.getChildrenSize() === 0
                ) {
                  sourceParent.remove();
                }

                return;
              }
            }
          }

          if (taskTitle) {
            const paragraph = $createParagraphNode();
            const checklistNode = $createChecklistNode(taskState);
            const textNode = $createTextNode(" " + taskTitle);
            paragraph.append(checklistNode, textNode);
            targetNode.insertAfter(paragraph);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    window.addEventListener("dragend", removeDragOverStyles);

    return () => {
      unregisterDragOver();
      unregisterDrop();
      window.removeEventListener("dragend", removeDragOverStyles);
      removeDragOverStyles();
    };
  }, [editor]);

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

// Helper plugin to handle Enter key inside Checklist tasks to create a sibling task at the same indentation level
function ChecklistEnterPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        let targetListItem: ListItemNode | null = null;
        let curr: LexicalNode | null = anchorNode;
        while (curr) {
          if ($isListItemNode(curr)) {
            targetListItem = curr;
            break;
          }
          curr = curr.getParent();
        }

        if (targetListItem) {
          const children = targetListItem.getChildren();
          const checklistChild = children.find((c) => $isChecklistNode(c));

          if (checklistChild && $isChecklistNode(checklistChild)) {
            event?.preventDefault();

            // Check if item is empty (only checklist node, or checklist node + whitespace text)
            const pureText = targetListItem
              .getTextContent()
              .replace(/\[([ x\->])\]/gi, "")
              .trim();

            if (!pureText && children.length <= 2) {
              const parentList = targetListItem.getParent();
              if ($isListNode(parentList)) {
                targetListItem.remove();
                const p = $createParagraphNode();
                parentList.insertAfter(p);
                if (parentList.getChildrenSize() === 0) {
                  parentList.remove();
                }
                p.select();
                return true;
              }
            }

            const marker = $isCustomListItemNode(targetListItem)
              ? targetListItem.getMarker()
              : "-";
            const newListItem = $createCustomListItemNode(
              undefined,
              undefined,
              marker
            );
            const newChecklist = $createChecklistNode("open");
            newListItem.append(newChecklist);

            const anchorOffset = selection.anchor.offset;
            const isAnchorText = anchorNode.getType() === "text";

            if (isAnchorText) {
              const anchorIndex = children.indexOf(anchorNode);
              const textContent = anchorNode.getTextContent();
              const firstPartText = textContent.slice(0, anchorOffset);
              const remainingText = textContent.slice(anchorOffset);

              (anchorNode as any).setTextContent(firstPartText);

              if (remainingText) {
                newListItem.append($createTextNode(remainingText));
              }

              for (let i = anchorIndex + 1; i < children.length; i++) {
                newListItem.append(children[i]);
              }
            }

            targetListItem.insertAfter(newListItem);

            if (newListItem.getChildrenSize() === 1) {
              const emptyText = $createTextNode(" ");
              newListItem.append(emptyText);
              emptyText.select(1, 1);
            } else {
              const secondChild = newListItem.getChildAtIndex(1);
              if ($isTextNode(secondChild)) {
                secondChild.select(0, 0);
              } else {
                newListItem.select();
              }
            }

            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
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
  workspaceDir,
  onTasksChange,
  onRegisterToggleTask,
  onRegisterRemoveTask,
}) => {
  const displayFilename = formatShortPath(filename, workspaceDir);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeFilenameRef = useRef(filename);
  const currentContentRef = useRef(markdownContent);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addTaskFnRef = useRef<(() => void) | null>(null);
  const changeStatusFnRef = useRef<((status: TaskState) => void) | null>(null);

  currentContentRef.current = markdownContent;

  const handleRegisterAddTask = useCallback((fn: () => void) => {
    addTaskFnRef.current = fn;
  }, []);

  const handleRegisterChangeStatus = useCallback(
    (fn: (status: TaskState) => void) => {
      changeStatusFnRef.current = fn;
    },
    []
  );

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
    if (addTaskFnRef.current) {
      addTaskFnRef.current();
    } else {
      const newTaskLine =
        currentContentRef.current.endsWith("\n") || !currentContentRef.current
          ? "[ ] New task"
          : "\n[ ] New task";
      const updated = currentContentRef.current + newTaskLine;
      handleMarkdownChange(updated);
    }
  }, [handleMarkdownChange]);

  const handleActionBarChangeStatus = useCallback(
    (status: TaskState) => {
      if (changeStatusFnRef.current) {
        changeStatusFnRef.current(status);
      } else {
        const syntax = formatTaskState(status);
        const lineToAdd =
          currentContentRef.current.endsWith("\n") || !currentContentRef.current
            ? `${syntax} Task item`
            : `\n${syntax} Task item`;
        const updated = currentContentRef.current + lineToAdd;
        handleMarkdownChange(updated);
      }
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

  const handleActionBarInsertPriorityTemplate = useCallback(() => {
    const template = `## Urgent\n- [ ] \n\n## High\n- [ ] \n\n## Low\n- [ ] `;
    let lineToAdd = template;
    if (currentContentRef.current) {
      if (currentContentRef.current.endsWith("\n\n")) {
        lineToAdd = template;
      } else if (currentContentRef.current.endsWith("\n")) {
        lineToAdd = "\n" + template;
      } else {
        lineToAdd = "\n\n" + template;
      }
    }
    const updated = currentContentRef.current + lineToAdd;
    handleMarkdownChange(updated);
  }, [handleMarkdownChange]);

  const handleActionBarInsertPriorityHeader = useCallback(
    (priority: "Urgent" | "High" | "Low") => {
      const headerText = `## ${priority}\n- [ ] `;
      let lineToAdd = headerText;
      if (currentContentRef.current) {
        if (currentContentRef.current.endsWith("\n\n")) {
          lineToAdd = headerText;
        } else if (currentContentRef.current.endsWith("\n")) {
          lineToAdd = "\n" + headerText;
        } else {
          lineToAdd = "\n\n" + headerText;
        }
      }
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
            {displayFilename}
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
        onInsertPriorityTemplate={handleActionBarInsertPriorityTemplate}
        onInsertPriorityHeader={handleActionBarInsertPriorityHeader}
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
          <ActiveFileContext.Provider value={filename}>
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
                <FormattingToolbar />
                <div
                  style={{ flex: 1, position: "relative", overflowY: "auto" }}
                >
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        data-testid="editor-contenteditable"
                        aria-label={`Editor for ${filename}`}
                        className="lexical-editor-root"
                        spellCheck={false}
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
                <TaskRemoveHandlerPlugin
                  onRegisterRemoveTask={onRegisterRemoveTask}
                />
                <TaskInsertHandlerPlugin
                  onRegisterAddTask={handleRegisterAddTask}
                  onRegisterChangeStatus={handleRegisterChangeStatus}
                />
                <TaskKeyboardPlugin />
                <MarkdownSyncPlugin
                  initialContent={markdownContent}
                  onMarkdownChange={handleMarkdownChange}
                />
                <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
                <PriorityHeaderPlugin />
                <TaskDragDropPlugin />
                <ChecklistEnterPlugin />
                <KeyboardSavePlugin onSave={handleManualSave} />
              </div>
            </LexicalComposer>
          </ActiveFileContext.Provider>
        )}
      </div>
    </main>
  );
};

export default EditorPane;
