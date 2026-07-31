import { TextMatchTransformer, TRANSFORMERS } from "@lexical/markdown";
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

export const ALL_TRANSFORMERS = [CHECKLIST_TRANSFORMER, ...TRANSFORMERS];
