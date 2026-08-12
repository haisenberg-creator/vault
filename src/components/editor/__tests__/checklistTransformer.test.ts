import { describe, it, expect } from "vitest";
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code-core";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { ChecklistNode } from "../ChecklistNode";
import { ARROW_TRANSFORMER, ALL_TRANSFORMERS } from "../checklistTransformer";

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

describe("ARROW_TRANSFORMER", () => {
  it("has correct configuration for Lexical TextMatchTransformer", () => {
    expect(ARROW_TRANSFORMER.type).toBe("text-match");
    expect(ARROW_TRANSFORMER.trigger).toBe(">");
    expect(ARROW_TRANSFORMER.regExp).toEqual(/=>$/);
    expect(ARROW_TRANSFORMER.importRegExp).toEqual(/=>/);
  });

  it("converts => to ⇒ on Markdown import", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    editor.update(() => {
      $convertFromMarkdownString(
        "Task completed => Next step",
        ALL_TRANSFORMERS
      );
      const root = $getRoot();
      expect(root.getTextContent()).toBe("Task completed ⇒ Next step");
    });
  });

  it("exports ⇒ back to => on Markdown export", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode("Task completed ⇒ Next step"));
      root.append(p);

      const markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
      expect(markdown).toBe("Task completed => Next step");
    });
  });

  it("replaces target textNode with arrow symbol in replace handler", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    editor.update(() => {
      const node = $createTextNode("=>");
      if (ARROW_TRANSFORMER.replace) {
        ARROW_TRANSFORMER.replace(node, ["=>"]);
      }
      expect(node.getTextContent()).toBe("⇒");
    });
  });
});
