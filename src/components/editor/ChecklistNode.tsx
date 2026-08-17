import React from "react";
import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $getNodeByKey,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export type TaskState = "open" | "in_progress" | "blocked" | "completed";

export type SerializedChecklistNode = Spread<
  {
    state: TaskState;
  },
  SerializedLexicalNode
>;

export function parseTaskState(raw: string): TaskState {
  switch (raw) {
    case "-":
      return "in_progress";
    case ">":
      return "blocked";
    case "x":
    case "X":
      return "completed";
    case " ":
    default:
      return "open";
  }
}

export function formatTaskState(state: TaskState): string {
  switch (state) {
    case "in_progress":
      return "[-]";
    case "blocked":
      return "[>]";
    case "completed":
      return "[x]";
    case "open":
    default:
      return "[ ]";
  }
}

export function getNextTaskState(current: TaskState): TaskState {
  switch (current) {
    case "open":
      return "in_progress";
    case "in_progress":
      return "completed";
    case "completed":
      return "blocked";
    case "blocked":
      return "open";
    default:
      return "open";
  }
}

export const ActiveFileContext = React.createContext<string>("");

interface ChecklistComponentProps {
  nodeKey: NodeKey;
  state: TaskState;
}

export const ChecklistComponent: React.FC<ChecklistComponentProps> = ({
  nodeKey,
  state,
}) => {
  const [editor] = useLexicalComposerContext();
  const activeFile = React.useContext(ActiveFileContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isChecklistNode(node)) {
        const nextState = getNextTaskState(node.getState());
        node.setState(nextState);
      }
    });
  };

  const getStyleAndIcon = () => {
    switch (state) {
      case "in_progress":
        return {
          bg: "rgba(246, 193, 119, 0.15)",
          color: "#f6c177",
          border: "1px solid rgba(246, 193, 119, 0.4)",
          icon: (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
          label: "IN PROGRESS",
          shadow: "0 0 8px rgba(246, 193, 119, 0.25)",
        };
      case "blocked":
        return {
          bg: "rgba(235, 111, 146, 0.15)",
          color: "#eb6f92",
          border: "1px solid rgba(235, 111, 146, 0.4)",
          icon: (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          ),
          label: "BLOCKED",
          shadow: "0 0 8px rgba(235, 111, 146, 0.25)",
        };
      case "completed":
        return {
          bg: "rgba(49, 116, 143, 0.2)",
          color: "#9ccfd8",
          border: "1px solid rgba(49, 116, 143, 0.4)",
          icon: (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ),
          label: "DONE",
          shadow: "none",
        };
      case "open":
      default:
        return {
          bg: "rgba(110, 106, 134, 0.15)",
          color: "var(--rose-subtle, #908caa)",
          border: "1px solid rgba(110, 106, 134, 0.3)",
          icon: (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          ),
          label: "OPEN",
          shadow: "none",
        };
    }
  };

  const info = getStyleAndIcon();

  const handleDragStart = (e: React.DragEvent) => {
    if (state === "completed") {
      e.preventDefault();
      return;
    }

    let taskTitle = "";
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        const parent = node.getParent();
        const fullText = parent ? parent.getTextContent() : "";
        taskTitle = fullText.replace(/\[([ x\->])\]/gi, "").trim();
      }
    });

    if (taskTitle) {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          taskTitle,
          sourceFile: activeFile || "",
          nodeKey,
          state,
        })
      );
      e.dataTransfer.setData("application/x-lexical-task-key", nodeKey);
      e.dataTransfer.setData("text/plain", `task-drag:${taskTitle}`);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const isDraggable = state !== "completed";

  return (
    <span
      data-testid={`checklist-node-${state}`}
      data-task-state={state}
      onClick={handleClick}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
      title={
        isDraggable
          ? `Click to change state from ${state}, or drag to move task to another note`
          : `Click to change state from ${state}`
      }
      className="tactile-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        margin: "0 4px",
        borderRadius: "4px",
        backgroundColor: info.bg,
        color: info.color,
        border: info.border,
        boxShadow: info.shadow,
        cursor: isDraggable ? "grab" : "pointer",
        userSelect: "none",
        fontSize: "12px",
        fontFamily: "var(--font-mono, monospace)",
        fontWeight: 600,
        verticalAlign: "middle",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {info.icon}
      </span>
      <span>{info.label}</span>
    </span>
  );
};

export class ChecklistNode extends DecoratorNode<React.ReactNode> {
  __taskState: TaskState;

  static getType(): string {
    return "checklist-item";
  }

  static clone(node: ChecklistNode): ChecklistNode {
    return new ChecklistNode(node.__taskState, node.__key);
  }

  constructor(state: TaskState = "open", key?: NodeKey) {
    super(key);
    this.__taskState = state;
  }

  static importJSON(serializedNode: SerializedChecklistNode): ChecklistNode {
    const node = $createChecklistNode(serializedNode.state);
    return node;
  }

  exportJSON(): SerializedChecklistNode {
    return {
      state: this.__taskState,
      type: "checklist-item",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  getState(): TaskState {
    return this.__taskState;
  }

  setState(state: TaskState): void {
    const writable = this.getWritable();
    writable.__taskState = state;
  }

  getMarkdownSyntax(): string {
    return formatTaskState(this.__taskState);
  }

  getTextContent(): string {
    return formatTaskState(this.__taskState);
  }

  decorate(): React.ReactNode {
    return <ChecklistComponent nodeKey={this.__key} state={this.__taskState} />;
  }
}

export function $createChecklistNode(state: TaskState = "open"): ChecklistNode {
  return new ChecklistNode(state);
}

export function $isChecklistNode(
  node: LexicalNode | null | undefined
): node is ChecklistNode {
  return node instanceof ChecklistNode;
}
