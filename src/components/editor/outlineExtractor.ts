import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import { $getRoot, $isElementNode, LexicalNode } from "lexical";

export interface HeadingItem {
  key: string;
  level: number; // 1 to 6
  text: string;
}

export interface OutlineTreeNode {
  id: string;
  key: string;
  level: number; // 0 for virtual root, 1..6 for headings
  text: string;
  children: OutlineTreeNode[];
}

export interface PositionedNode extends OutlineTreeNode {
  x: number;
  y: number;
  width: number;
  height: number;
  children: PositionedNode[];
}

export interface TreeConnection {
  id: string;
  from: PositionedNode;
  to: PositionedNode;
  path: string;
  color: string;
}

export interface TreeLayoutResult {
  root: PositionedNode | null;
  nodes: PositionedNode[];
  connections: TreeConnection[];
  width: number;
  height: number;
}

export const LEVEL_COLORS: Record<
  number,
  { stroke: string; bg: string; text: string }
> = {
  0: {
    stroke: "var(--rose-pine)",
    bg: "rgba(49, 116, 143, 0.18)",
    text: "var(--rose-pine)",
  },
  1: {
    stroke: "var(--rose-love)",
    bg: "rgba(235, 111, 146, 0.18)",
    text: "var(--rose-love)",
  },
  2: {
    stroke: "var(--rose-gold)",
    bg: "rgba(246, 193, 119, 0.18)",
    text: "var(--rose-gold)",
  },
  3: {
    stroke: "var(--rose-foam)",
    bg: "rgba(156, 207, 216, 0.18)",
    text: "var(--rose-foam)",
  },
  4: {
    stroke: "var(--rose-pine)",
    bg: "rgba(49, 116, 143, 0.18)",
    text: "var(--rose-pine)",
  },
  5: {
    stroke: "var(--rose-iris)",
    bg: "rgba(196, 167, 231, 0.18)",
    text: "var(--rose-iris)",
  },
  6: {
    stroke: "var(--rose-subtle)",
    bg: "rgba(144, 140, 170, 0.18)",
    text: "var(--rose-subtle)",
  },
};

/**
 * Extracts heading items (level 1..6, key, and text content) from the Lexical AST in document order.
 */
export function extractHeadingsFromDocument(): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const traverse = (node: LexicalNode) => {
    if ($isHeadingNode(node)) {
      const tag = node.getTag();
      const level = parseInt(tag.replace("h", ""), 10) || 1;
      const text = node.getTextContent().trim();
      headings.push({
        key: node.getKey(),
        level,
        text: text || `Heading ${level}`,
      });
    }
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        traverse(child);
      }
    }
  };
  traverse($getRoot());
  return headings;
}

/**
 * Constructs a hierarchical OutlineTreeNode tree from a flat list of headings.
 * If the document starts with a single H1 and contains no subsequent H1s, that H1 acts as the root.
 * Otherwise, a virtual root node is created representing the document.
 */
export function buildHeadingTree(
  headings: HeadingItem[],
  rootTitle: string = "Document"
): OutlineTreeNode | null {
  if (!headings || headings.length === 0) {
    return null;
  }

  const first = headings[0];
  const hasMultipleH1 = headings.filter((h) => h.level === 1).length > 1;

  let root: OutlineTreeNode;
  let startIndex = 0;

  if (first.level === 1 && !hasMultipleH1) {
    root = {
      id: first.key,
      key: first.key,
      level: 1,
      text: first.text,
      children: [],
    };
    startIndex = 1;
  } else {
    root = {
      id: "root",
      key: "root",
      level: 0,
      text: rootTitle,
      children: [],
    };
    startIndex = 0;
  }

  const stack: OutlineTreeNode[] = [root];

  for (let i = startIndex; i < headings.length; i++) {
    const item = headings[i];
    const node: OutlineTreeNode = {
      id: item.key,
      key: item.key,
      level: item.level,
      text: item.text,
      children: [],
    };

    // Pop until the top of the stack is an ancestor with lower level
    while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    parent.children.push(node);
    stack.push(node);
  }

  return root;
}

/**
 * Generates an organic cubic bezier SVG curve definition between parent and child coordinates.
 */
export function getCubicBezierPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): string {
  const dx = toX - fromX;
  const cx1 = fromX + dx * 0.5;
  const cy1 = fromY;
  const cx2 = fromX + dx * 0.5;
  const cy2 = toY;
  return `M ${fromX},${fromY} C ${cx1},${cy1} ${cx2},${cy2} ${toX},${toY}`;
}

/**
 * Calculates responsive tidy tree positions for all nodes and connects them with organic bezier curves.
 */
export function calculateTreeLayout(
  tree: OutlineTreeNode | null
): TreeLayoutResult {
  if (!tree) {
    return { root: null, nodes: [], connections: [], width: 0, height: 0 };
  }

  const NODE_HEIGHT = 34;
  const ROW_GAP = 14;
  const COL_GAP = 42;
  const PADDING_X = 24;
  const PADDING_Y = 24;

  let currentY = PADDING_Y;
  const allPositionedNodes: PositionedNode[] = [];
  const connections: TreeConnection[] = [];

  function estimateNodeWidth(text: string): number {
    const rawLen = text ? text.length : 8;
    return Math.min(220, Math.max(120, rawLen * 7.5 + 46));
  }

  function positionSubtree(
    node: OutlineTreeNode,
    currentX: number
  ): PositionedNode {
    const width = estimateNodeWidth(node.text);
    const positioned: PositionedNode = {
      ...node,
      x: currentX,
      y: 0,
      width,
      height: NODE_HEIGHT,
      children: [],
    };

    if (node.children.length === 0) {
      positioned.y = currentY;
      currentY += NODE_HEIGHT + ROW_GAP;
    } else {
      const childX = currentX + width + COL_GAP;
      for (const child of node.children) {
        const positionedChild = positionSubtree(child, childX);
        positioned.children.push(positionedChild);

        // Record connection from parent to child
        const color =
          LEVEL_COLORS[positionedChild.level]?.stroke || "var(--rose-subtle)";

        connections.push({
          id: `conn-${node.id}-${positionedChild.id}`,
          from: positioned,
          to: positionedChild,
          path: "", // Computed once parent Y is finalized
          color,
        });
      }

      const firstChildY = positioned.children[0].y;
      const lastChildY = positioned.children[positioned.children.length - 1].y;
      positioned.y = (firstChildY + lastChildY) / 2;
    }

    allPositionedNodes.push(positioned);
    return positioned;
  }

  const positionedRoot = positionSubtree(tree, PADDING_X);

  // Finalize all connection paths using exact parent and child Y positions
  for (const conn of connections) {
    const fromX = conn.from.x + conn.from.width;
    const fromY = conn.from.y + conn.from.height / 2;
    const toX = conn.to.x;
    const toY = conn.to.y + conn.to.height / 2;
    conn.path = getCubicBezierPath(fromX, fromY, toX, toY);
  }

  let maxX = 0;
  let maxY = 0;
  for (const node of allPositionedNodes) {
    if (node.x + node.width > maxX) maxX = node.x + node.width;
    if (node.y + node.height > maxY) maxY = node.y + node.height;
  }

  const width = Math.max(340, maxX + PADDING_X);
  const height = Math.max(260, maxY + PADDING_Y);

  return {
    root: positionedRoot,
    nodes: allPositionedNodes,
    connections,
    width,
    height,
  };
}

/**
 * Lexical plugin that listens to editor updates, extracts heading nodes, and notifies subscribers.
 */
export function OutlineExtractorPlugin({
  onHeadingsChange,
}: {
  onHeadingsChange?: (headings: HeadingItem[]) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onHeadingsChange) return;

    const extractAndEmit = () => {
      editor.getEditorState().read(() => {
        const headings = extractHeadingsFromDocument();
        onHeadingsChange(headings);
      });
    };

    extractAndEmit();

    return editor.registerUpdateListener(() => {
      extractAndEmit();
    });
  }, [editor, onHeadingsChange]);

  return null;
}
