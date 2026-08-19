import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createEditor } from "lexical";
import { EditorPane } from "../EditorPane";
import {
  CustomListItemNode,
  $createCustomListItemNode,
  $isCustomListItemNode,
} from "../CustomListItemNode";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import { ALL_TRANSFORMERS } from "../checklistTransformer";
import { ListNode } from "@lexical/list";
import { ChecklistNode } from "../ChecklistNode";
import * as fileService from "../../../services/fileService";

vi.mock("../../../services/fileService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../services/fileService")>();
  return {
    ...actual,
    readMarkdownFile: vi.fn(),
    writeMarkdownFile: vi.fn(),
  };
});

describe("CustomListItemNode & Custom List Markers", () => {
  it("creates and manages custom markers on CustomListItemNode", () => {
    const editor = createEditor({ nodes: [CustomListItemNode, ListNode] });
    editor.update(() => {
      const node = $createCustomListItemNode(undefined, undefined, "★");
      expect($isCustomListItemNode(node)).toBe(true);
      expect(node.getMarker()).toBe("★");

      const json = node.exportJSON();
      expect(json.marker).toBe("★");
      expect(json.type).toBe("custom-listitem");

      const imported = CustomListItemNode.importJSON(json);
      expect(imported.getMarker()).toBe("★");
    });
  });

  it("converts markdown with custom markers into CustomListItemNodes and back", () => {
    const editor = createEditor({
      nodes: [CustomListItemNode, ListNode, ChecklistNode],
    });

    const markdown = [
      "- Dash item",
      "+ Plus item",
      "* Star item",
      "★ Symbol item",
      "• Dot item",
      "→ Arrow item",
    ].join("\n");

    editor.update(() => {
      $convertFromMarkdownString(markdown, ALL_TRANSFORMERS);
      const exported = $convertToMarkdownString(ALL_TRANSFORMERS);
      expect(exported).toContain("- Dash item");
      expect(exported).toContain("+ Plus item");
      expect(exported).toContain("* Star item");
      expect(exported).toContain("★ Symbol item");
      expect(exported).toContain("• Dot item");
      expect(exported).toContain("→ Arrow item");
    });
  });

  it("renders editor with custom markers having data-marker attributes", async () => {
    const markdown = "★ Star Task Item\n• Dot Item";
    vi.mocked(fileService.readMarkdownFile).mockResolvedValue(markdown);

    render(<EditorPane filename="custom-markers.md" />);

    await waitFor(() => {
      expect(screen.queryByText("Loading document...")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const starEl = screen.getByText("Star Task Item");
      expect(starEl).toBeInTheDocument();
      const liElement = starEl.closest("li");
      expect(liElement).toHaveAttribute("data-marker", "★");
    });
  });
});
