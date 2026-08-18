import {
  ElementTransformer,
  TextMatchTransformer,
  TRANSFORMERS,
  UNORDERED_LIST,
} from "@lexical/markdown";
import {
  ListNode,
  $createListNode,
  $isListNode,
  ListItemNode,
} from "@lexical/list";
import { $isElementNode, $isTextNode, ElementNode, LexicalNode } from "lexical";
import {
  CustomListItemNode,
  $createCustomListItemNode,
  $isCustomListItemNode,
} from "./CustomListItemNode";
import {
  ChecklistNode,
  $createChecklistNode,
  $isChecklistNode,
  parseTaskState,
} from "./ChecklistNode";

export const CHECKLIST_TRANSFORMER: TextMatchTransformer = {
  dependencies: [ChecklistNode],
  export: (node) => {
    if ($isChecklistNode(node)) {
      return node.getMarkdownSyntax();
    }
    return null;
  },
  importRegExp: /\[([ x\->])\]/,
  regExp: /\[([ x\->])\]$/,
  replace: (textNode, match) => {
    const rawState = match[1];
    const state = parseTaskState(rawState);
    const checklistNode = $createChecklistNode(state);
    textNode.replace(checklistNode);
  },
  trigger: "]",
  type: "text-match",
};

export const ARROW_TRANSFORMER: TextMatchTransformer = {
  dependencies: [],
  export: (node) => {
    if ($isTextNode(node)) {
      const text = node.getTextContent();
      if (text.includes("⇒")) {
        return text.replace(/⇒/g, "=>");
      }
    }
    return null;
  },
  importRegExp: /=>/,
  regExp: /=>$/,
  replace: (textNode) => {
    textNode.setTextContent("⇒");
  },
  trigger: ">",
  type: "text-match",
};

export const CUSTOM_UNORDERED_LIST: ElementTransformer = {
  dependencies: [ListNode, CustomListItemNode, ListItemNode],
  export: (
    node: LexicalNode,
    traverseChildren: (node: ElementNode) => string
  ): string | null => {
    if (!$isListNode(node)) {
      return null;
    }
    if (node.getListType() !== "bullet") {
      return null;
    }
    const children = node.getChildren();
    const lines: string[] = [];
    for (const child of children) {
      if ($isCustomListItemNode(child)) {
        const marker = child.getMarker() || "-";
        const content = traverseChildren(child);
        if (content.trim().length > 0) {
          lines.push(`${marker} ${content}`);
        }
      } else if ($isElementNode(child)) {
        const content = traverseChildren(child);
        if (content.trim().length > 0) {
          lines.push(`- ${content}`);
        }
      }
    }
    return lines.length > 0 ? lines.join("\n") : null;
  },
  regExp: /^(\s*)([-*+•◦▪→★])\s/,
  replace: (parentNode, children, match) => {
    const marker = match[2];
    const prevSibling = parentNode.getPreviousSibling();
    const listItemNode = $createCustomListItemNode(
      undefined,
      undefined,
      marker
    );
    listItemNode.append(...children);

    if ($isListNode(prevSibling) && prevSibling.getListType() === "bullet") {
      prevSibling.append(listItemNode);
      parentNode.remove();
    } else {
      const listNode = $createListNode("bullet");
      listNode.append(listItemNode);
      parentNode.replace(listNode);
    }
  },
  type: "element",
};

export const MARKER_UNORDERED_LIST_TRANSFORMER = CUSTOM_UNORDERED_LIST;

const baseTransformersWithoutUnordered = TRANSFORMERS.filter(
  (t) => t !== UNORDERED_LIST
);

export const ALL_TRANSFORMERS = [
  CHECKLIST_TRANSFORMER,
  CUSTOM_UNORDERED_LIST,
  ARROW_TRANSFORMER,
  ...baseTransformersWithoutUnordered,
];
