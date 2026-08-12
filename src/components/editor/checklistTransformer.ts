import {
  ElementTransformer,
  TextMatchTransformer,
  TRANSFORMERS,
  UNORDERED_LIST,
} from "@lexical/markdown";
import { ListNode, ListItemNode, $isListNode } from "@lexical/list";
import { $isTextNode } from "lexical";
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

export const MARKER_UNORDERED_LIST_TRANSFORMER: ElementTransformer = {
  dependencies: [ListNode, ListItemNode],
  export: (node, exportChildren, selection) => {
    if ($isListNode(node) && node.getListType() === "bullet") {
      return UNORDERED_LIST.export(node, exportChildren, selection);
    }
    return null;
  },
  regExp: /^(\s*)([*+-]|•|◦|▪|→|★)\s/,
  replace: (parentNode, children, startMatch, isInitial) => {
    const rawMarker = startMatch ? startMatch[2] : "-";
    const marker = rawMarker.trim();

    UNORDERED_LIST.replace(parentNode, children, startMatch, isInitial);

    const parent = parentNode.getParent();
    if ($isListNode(parent)) {
      parent.setStyle(`list-style-type: "${marker} ";`);
    } else {
      const grandParent = parentNode.getParent();
      if (grandParent) {
        const listNode = grandParent
          .getChildren()
          .find((n) => $isListNode(n) && n.getListType() === "bullet");
        if ($isListNode(listNode)) {
          listNode.setStyle(`list-style-type: "${marker} ";`);
        }
      }
    }
  },
  triggerOnEnter: true,
  type: "element",
};

const OTHER_TRANSFORMERS = TRANSFORMERS.filter((t) => t !== UNORDERED_LIST);

export const ALL_TRANSFORMERS = [
  CHECKLIST_TRANSFORMER,
  MARKER_UNORDERED_LIST_TRANSFORMER,
  ARROW_TRANSFORMER,
  ...OTHER_TRANSFORMERS,
];
