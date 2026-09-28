import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NoteMindMapView } from "../NoteMindMapView";
import {
  buildHeadingTree,
  calculateTreeLayout,
  getCubicBezierPath,
  HeadingItem,
} from "../outlineExtractor";

describe("NoteMindMapView and outlineExtractor", () => {
  describe("outlineExtractor unit tests", () => {
    it("returns null for empty headings", () => {
      expect(buildHeadingTree([])).toBeNull();
    });

    it("makes a single top-level H1 the root of the tree", () => {
      const headings: HeadingItem[] = [
        { key: "h1-1", level: 1, text: "Main Title" },
        { key: "h2-1", level: 2, text: "Section 1" },
        { key: "h3-1", level: 3, text: "Subsection 1.1" },
        { key: "h2-2", level: 2, text: "Section 2" },
      ];

      const tree = buildHeadingTree(headings, "Test Note");
      expect(tree).not.toBeNull();
      expect(tree?.key).toBe("h1-1");
      expect(tree?.text).toBe("Main Title");
      expect(tree?.level).toBe(1);
      expect(tree?.children.length).toBe(2);

      // Section 1
      expect(tree?.children[0].text).toBe("Section 1");
      expect(tree?.children[0].level).toBe(2);
      expect(tree?.children[0].children.length).toBe(1);
      expect(tree?.children[0].children[0].text).toBe("Subsection 1.1");

      // Section 2
      expect(tree?.children[1].text).toBe("Section 2");
      expect(tree?.children[1].level).toBe(2);
      expect(tree?.children[1].children.length).toBe(0);
    });

    it("creates a virtual document root when multiple H1 headings exist", () => {
      const headings: HeadingItem[] = [
        { key: "h1-1", level: 1, text: "Chapter 1" },
        { key: "h2-1", level: 2, text: "Scene A" },
        { key: "h1-2", level: 1, text: "Chapter 2" },
      ];

      const tree = buildHeadingTree(headings, "My Novel");
      expect(tree).not.toBeNull();
      expect(tree?.key).toBe("root");
      expect(tree?.text).toBe("My Novel");
      expect(tree?.level).toBe(0);
      expect(tree?.children.length).toBe(2);
      expect(tree?.children[0].text).toBe("Chapter 1");
      expect(tree?.children[1].text).toBe("Chapter 2");
    });

    it("creates a virtual root when note starts with H2 or H3", () => {
      const headings: HeadingItem[] = [
        { key: "h2-1", level: 2, text: "Overview" },
        { key: "h2-2", level: 2, text: "Getting Started" },
      ];

      const tree = buildHeadingTree(headings, "Guide");
      expect(tree).not.toBeNull();
      expect(tree?.key).toBe("root");
      expect(tree?.text).toBe("Guide");
      expect(tree?.level).toBe(0);
      expect(tree?.children.length).toBe(2);
    });

    it("generates organic cubic bezier SVG paths", () => {
      const path = getCubicBezierPath(100, 50, 200, 150);
      expect(path).toBe("M 100,50 C 150,50 150,150 200,150");
    });

    it("calculates non-overlapping tree layout positions and connections", () => {
      const headings: HeadingItem[] = [
        { key: "1", level: 1, text: "Root Note" },
        { key: "2", level: 2, text: "Sub 1" },
        { key: "3", level: 2, text: "Sub 2" },
      ];

      const tree = buildHeadingTree(headings);
      const layout = calculateTreeLayout(tree);

      expect(layout.root).not.toBeNull();
      expect(layout.nodes.length).toBe(3);
      expect(layout.connections.length).toBe(2);

      // Verify connections have valid bezier path data
      for (const conn of layout.connections) {
        expect(conn.path).toMatch(/^M \d+(\.\d+)?,.* C .* \d+(\.\d+)?,/);
        expect(conn.color).toBeDefined();
      }

      // Verify root is to the left of its children
      const rootNode = layout.nodes.find((n) => n.key === "1");
      const child1 = layout.nodes.find((n) => n.key === "2");
      const child2 = layout.nodes.find((n) => n.key === "3");

      expect(rootNode).toBeDefined();
      expect(child1).toBeDefined();
      expect(child2).toBeDefined();

      if (rootNode && child1 && child2) {
        expect(child1.x).toBeGreaterThan(rootNode.x + rootNode.width);
        expect(child2.x).toBeGreaterThan(rootNode.x + rootNode.width);
        expect(child2.y).toBeGreaterThan(child1.y);
      }
    });
  });

  describe("NoteMindMapView component tests", () => {
    it("renders empty state when there are no headings", () => {
      render(<NoteMindMapView headings={[]} noteTitle="Empty Note" />);

      expect(screen.getByTestId("mindmap-empty-state")).toBeInTheDocument();
      expect(screen.getByText("No Outline Headings")).toBeInTheDocument();
      expect(screen.getByTestId("mindmap-heading-count")).toHaveTextContent(
        "0"
      );
    });

    it("renders SVG tree nodes and connector curves for note headings", () => {
      const headings: HeadingItem[] = [
        { key: "h1-arch", level: 1, text: "Architecture" },
        { key: "h2-core", level: 2, text: "Core Service" },
        { key: "h2-ui", level: 2, text: "UI Components" },
      ];

      render(<NoteMindMapView headings={headings} noteTitle="Architecture" />);

      expect(screen.getByTestId("mindmap-svg")).toBeInTheDocument();
      expect(screen.getByTestId("mindmap-heading-count")).toHaveTextContent(
        "3"
      );

      // Verify nodes are rendered with level badges
      expect(screen.getByTestId("mindmap-node-h1-arch")).toBeInTheDocument();
      expect(screen.getByTestId("mindmap-node-h2-core")).toBeInTheDocument();
      expect(screen.getByTestId("mindmap-node-h2-ui")).toBeInTheDocument();

      expect(screen.getByText("H1")).toBeInTheDocument();
      expect(screen.getAllByText("H2").length).toBe(2);

      // Verify connector curves rendered
      const connectors = screen.getAllByTestId("mindmap-connector");
      expect(connectors.length).toBe(2);
    });

    it("triggers onSelectHeading callback when a node is clicked", () => {
      const handleSelectHeading = vi.fn();
      const headings: HeadingItem[] = [
        { key: "h1-title", level: 1, text: "Project Alpha" },
        { key: "h2-tasks", level: 2, text: "Sprint Tasks" },
      ];

      render(
        <NoteMindMapView
          headings={headings}
          noteTitle="Project Alpha"
          onSelectHeading={handleSelectHeading}
        />
      );

      const taskNode = screen.getByTestId("mindmap-node-h2-tasks");
      fireEvent.click(taskNode);

      expect(handleSelectHeading).toHaveBeenCalledTimes(1);
      expect(handleSelectHeading).toHaveBeenCalledWith("h2-tasks", {
        key: "h2-tasks",
        level: 2,
        text: "Sprint Tasks",
      });
    });

    it("supports keyboard navigation via Enter and Space keys", () => {
      const handleSelectHeading = vi.fn();
      const headings: HeadingItem[] = [
        { key: "h1-kb", level: 1, text: "Keyboard Nav" },
      ];

      render(
        <NoteMindMapView
          headings={headings}
          noteTitle="Keyboard Note"
          onSelectHeading={handleSelectHeading}
        />
      );

      const node = screen.getByTestId("mindmap-node-h1-kb");

      fireEvent.keyDown(node, { key: "Enter" });
      expect(handleSelectHeading).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(node, { key: " " });
      expect(handleSelectHeading).toHaveBeenCalledTimes(2);
    });

    it("adjusts zoom scale with zoom buttons and resets to 100%", () => {
      const headings: HeadingItem[] = [
        { key: "h1-zoom", level: 1, text: "Zooming" },
      ];

      render(<NoteMindMapView headings={headings} noteTitle="Zoom Note" />);

      const zoomResetBtn = screen.getByTestId("mindmap-zoom-reset");
      const zoomInBtn = screen.getByTestId("mindmap-zoom-in");
      const zoomOutBtn = screen.getByTestId("mindmap-zoom-out");

      expect(zoomResetBtn).toHaveTextContent("100%");

      fireEvent.click(zoomInBtn);
      expect(zoomResetBtn).toHaveTextContent("115%");

      fireEvent.click(zoomOutBtn);
      expect(zoomResetBtn).toHaveTextContent("100%");

      fireEvent.click(zoomOutBtn);
      expect(zoomResetBtn).toHaveTextContent("85%");

      fireEvent.click(zoomResetBtn);
      expect(zoomResetBtn).toHaveTextContent("100%");
    });

    it("triggers onClose callback when close button is clicked", () => {
      const handleClose = vi.fn();
      const headings: HeadingItem[] = [
        { key: "h1-close", level: 1, text: "Closing" },
      ];

      render(
        <NoteMindMapView
          headings={headings}
          noteTitle="Close Test"
          onClose={handleClose}
        />
      );

      const closeBtn = screen.getByTestId("mindmap-close-btn");
      fireEvent.click(closeBtn);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
