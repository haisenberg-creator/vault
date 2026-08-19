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
import { HashtagNode, registerLexicalHashtag } from "@lexical/hashtag";
import { ChecklistNode } from "../ChecklistNode";
import { CustomListItemNode } from "../CustomListItemNode";
import { ARROW_TRANSFORMER, ALL_TRANSFORMERS } from "../checklistTransformer";

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
  HashtagNode,
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

describe("HIGHLIGHT and Rich Text Markdown Roundtrip", () => {
  it("imports ==highlighted text== and sets highlight format on TextNode", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    editor.update(() => {
      $convertFromMarkdownString(
        "Here is ==luminous highlight== in notes",
        ALL_TRANSFORMERS
      );
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      expect(paragraph).not.toBeNull();
      const children = (paragraph as any).getChildren();
      const highlightNode = children.find(
        (child: any) => child.hasFormat && child.hasFormat("highlight")
      );
      expect(highlightNode).toBeDefined();
      expect(highlightNode.getTextContent()).toBe("luminous highlight");
    });
  });

  it("exports text with highlight format as ==text== without HTML tags", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      const prefix = $createTextNode("Important: ");
      const highlighted = $createTextNode("urgent point");
      highlighted.toggleFormat("highlight");
      p.append(prefix, highlighted);
      root.append(p);

      const markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
      expect(markdown).toBe("Important: ==urgent point==");
      expect(markdown).not.toContain("<span");
      expect(markdown).not.toContain("style=");
    });
  });

  it("roundtrips combination of bold, italic, strikethrough, and highlight", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    const original =
      "Test with **bold**, *italic*, ~~strikethrough~~, and ==highlight==";
    editor.update(() => {
      $convertFromMarkdownString(original, ALL_TRANSFORMERS);
      const exported = $convertToMarkdownString(ALL_TRANSFORMERS);
      expect(exported).toBe(original);
    });
  });
});

describe("HASHTAG and Markdown Roundtrip", () => {
  it("preserves hashtags like #urgent and #project-x cleanly during roundtrip", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    registerLexicalHashtag(editor);

    const original =
      "# Project Roadmap\n\n- [ ] Fix critical authentication bug #urgent #security\n- [-] Implement #v1.1-polish dashboard filtering";
    editor.update(() => {
      $convertFromMarkdownString(original, ALL_TRANSFORMERS);
      const exported = $convertToMarkdownString(ALL_TRANSFORMERS);
      expect(exported).toBe(original);
    });
  });

  it("exports HashtagNode as standard #tag plain text without HTML wrapper tags", () => {
    const editor = createEditor({ nodes: EDITOR_NODES });
    registerLexicalHashtag(editor);

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode("Task for "), $createTextNode("#backend"));
      root.append(p);

      const markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
      expect(markdown).toBe("Task for #backend");
      expect(markdown).not.toContain("<span");
      expect(markdown).not.toContain("<div");
    });
  });
});
