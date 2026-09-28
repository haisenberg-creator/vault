import React, { useState, useMemo } from "react";
import { Network, ZoomIn, ZoomOut, X } from "lucide-react";
import {
  HeadingItem,
  PositionedNode,
  buildHeadingTree,
  calculateTreeLayout,
  LEVEL_COLORS,
} from "./outlineExtractor";

export interface NoteMindMapViewProps {
  headings: HeadingItem[];
  noteTitle?: string;
  onSelectHeading?: (key: string, heading: HeadingItem) => void;
  onClose?: () => void;
  className?: string;
}

export const NoteMindMapView: React.FC<NoteMindMapViewProps> = ({
  headings,
  noteTitle = "Document",
  onSelectHeading,
  onClose,
  className,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);

  // Compute hierarchical tree and responsive reactive SVG coordinates
  const layout = useMemo(() => {
    if (!headings || headings.length === 0) {
      return null;
    }
    const tree = buildHeadingTree(headings, noteTitle);
    return calculateTreeLayout(tree);
  }, [headings, noteTitle]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
  };

  const handleZoomReset = () => {
    setZoom(1.0);
  };

  const handleNodeClick = (node: PositionedNode) => {
    setSelectedNodeKey(node.key);
    onSelectHeading?.(node.key, {
      key: node.key,
      level: node.level,
      text: node.text,
    });
  };

  const truncateText = (text: string, maxLen: number = 22): string => {
    if (!text) return "";
    return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
  };

  return (
    <aside
      data-testid="note-mindmap-view"
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--rose-bg-surface)",
        borderLeft: "1px solid rgba(110, 106, 134, 0.25)",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Mind Map Header Bar */}
      <div
        style={{
          height: "40px",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(110, 106, 134, 0.2)",
          backgroundColor: "var(--rose-bg-overlay)",
          flexShrink: 0,
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <Network
            size={15}
            style={{ color: "var(--rose-foam)", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--rose-text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Mind Map Outline
          </span>
          <span
            data-testid="mindmap-heading-count"
            style={{
              fontSize: "10px",
              padding: "1px 6px",
              borderRadius: "4px",
              backgroundColor: "rgba(156, 207, 216, 0.15)",
              color: "var(--rose-foam)",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {headings.length}
          </span>
        </div>

        {/* Viewport & Close Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {layout && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                marginRight: "4px",
              }}
            >
              <button
                type="button"
                data-testid="mindmap-zoom-out"
                title="Zoom Out"
                onClick={handleZoomOut}
                className="tactile-btn"
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(110, 106, 134, 0.25)",
                  backgroundColor: "transparent",
                  color: "var(--rose-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ZoomOut size={12} />
              </button>
              <button
                type="button"
                data-testid="mindmap-zoom-reset"
                title="Reset Zoom (100%)"
                onClick={handleZoomReset}
                className="tactile-btn"
                style={{
                  height: "22px",
                  padding: "0 5px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(110, 106, 134, 0.25)",
                  backgroundColor: "transparent",
                  color: "var(--rose-subtle)",
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                data-testid="mindmap-zoom-in"
                title="Zoom In"
                onClick={handleZoomIn}
                className="tactile-btn"
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(110, 106, 134, 0.25)",
                  backgroundColor: "transparent",
                  color: "var(--rose-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ZoomIn size={12} />
              </button>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              data-testid="mindmap-close-btn"
              title="Close Mind Map"
              onClick={onClose}
              className="tactile-btn"
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(110, 106, 134, 0.25)",
                backgroundColor: "transparent",
                color: "var(--rose-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main View Area: Empty State or Interactive SVG */}
      {!layout || headings.length === 0 ? (
        <div
          data-testid="mindmap-empty-state"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
            textAlign: "center",
            gap: "12px",
            color: "var(--rose-subtle)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "rgba(156, 207, 216, 0.1)",
              border: "1px solid rgba(156, 207, 216, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--rose-foam)",
            }}
          >
            <Network size={22} />
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--rose-text)",
            }}
          >
            No Outline Headings
          </div>
          <div
            style={{
              fontSize: "11px",
              maxWidth: "220px",
              lineHeight: "1.5",
              color: "var(--rose-subtle)",
            }}
          >
            Add Markdown headings (<code># Title</code>, <code>## Section</code>
            ) in the editor to visualize the Mind Map.
          </div>
        </div>
      ) : (
        <div
          data-testid="mindmap-svg-container"
          style={{
            flex: 1,
            overflow: "auto",
            position: "relative",
            padding: "16px",
            backgroundColor: "var(--rose-bg-base)",
          }}
        >
          <svg
            data-testid="mindmap-svg"
            width={layout.width * zoom}
            height={layout.height * zoom}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={{
              display: "block",
              minWidth: `${layout.width * zoom}px`,
              minHeight: `${layout.height * zoom}px`,
              transition: "width 150ms ease-out, height 150ms ease-out",
            }}
          >
            <defs>
              <filter
                id="node-glow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            {/* Organic Bezier Branch Connections */}
            <g className="mindmap-branches">
              {layout.connections.map((conn) => {
                const isConnectedHovered =
                  hoveredNodeKey === conn.from.key ||
                  hoveredNodeKey === conn.to.key;
                return (
                  <path
                    key={conn.id}
                    data-testid="mindmap-connector"
                    d={conn.path}
                    fill="none"
                    stroke={conn.color}
                    strokeWidth={isConnectedHovered ? 2.5 : 1.75}
                    strokeOpacity={isConnectedHovered ? 0.9 : 0.45}
                    strokeLinecap="round"
                    style={{
                      transition:
                        "stroke-opacity 150ms ease-out, stroke-width 150ms ease-out",
                    }}
                  />
                );
              })}
            </g>

            {/* Heading Tree Nodes */}
            <g className="mindmap-nodes">
              {layout.nodes.map((node) => {
                const isHovered = hoveredNodeKey === node.key;
                const isSelected = selectedNodeKey === node.key;
                const levelColor = LEVEL_COLORS[node.level] || LEVEL_COLORS[6];

                return (
                  <g
                    key={node.key}
                    data-testid={`mindmap-node-${node.key}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Heading ${node.level === 0 ? "Document" : `H${node.level}`}: ${node.text}`}
                    onClick={() => handleNodeClick(node)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNodeClick(node);
                      }
                    }}
                    onMouseEnter={() => setHoveredNodeKey(node.key)}
                    onMouseLeave={() => setHoveredNodeKey(null)}
                    style={{
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <title>{`${node.level === 0 ? "Document Root" : `Heading ${node.level}`}: ${node.text}`}</title>

                    {/* Node Card Rectangle */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx="6"
                      fill={
                        isSelected
                          ? "rgba(156, 207, 216, 0.16)"
                          : "var(--rose-bg-surface)"
                      }
                      stroke={
                        isSelected
                          ? "var(--rose-foam)"
                          : isHovered
                            ? levelColor.stroke
                            : "rgba(110, 106, 134, 0.35)"
                      }
                      strokeWidth={isSelected || isHovered ? 2 : 1}
                      filter={isHovered ? "url(#node-glow)" : undefined}
                      style={{
                        transition:
                          "stroke 150ms ease-out, stroke-width 150ms ease-out, fill 150ms ease-out",
                      }}
                    />

                    {/* Level Pill Badge */}
                    <rect
                      x={node.x + 6}
                      y={node.y + 6}
                      width={24}
                      height={node.height - 12}
                      rx="4"
                      fill={levelColor.bg}
                    />
                    <text
                      x={node.x + 18}
                      y={node.y + 21}
                      textAnchor="middle"
                      fill={levelColor.text}
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {node.level === 0 ? "DOC" : `H${node.level}`}
                    </text>

                    {/* Node Label */}
                    <text
                      x={node.x + 36}
                      y={node.y + 21}
                      fill={
                        isSelected
                          ? "var(--rose-foam)"
                          : isHovered
                            ? "var(--rose-text)"
                            : "var(--rose-subtle)"
                      }
                      fontSize="12"
                      fontWeight={node.level <= 1 ? "600" : "500"}
                      fontFamily="var(--font-sans)"
                      style={{
                        transition: "fill 150ms ease-out",
                      }}
                    >
                      {truncateText(node.text, 20)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      )}
    </aside>
  );
};

export default NoteMindMapView;
