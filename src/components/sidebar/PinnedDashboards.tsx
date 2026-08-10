import React from "react";
import { FileTreeNode } from "../../types/workspaceTree";

export interface PinnedDashboardsProps {
  dashboards: FileTreeNode[];
  activeDashboardPath?: string;
  onSelectDashboard: (path: string) => void;
}

export const PinnedDashboards: React.FC<PinnedDashboardsProps> = ({
  dashboards,
  activeDashboardPath,
  onSelectDashboard,
}) => {
  if (dashboards.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="pinned-dashboards-strip"
      style={{
        padding: "10px 12px",
        borderBottom: "1px solid rgba(110, 106, 134, 0.15)",
        backgroundColor: "rgba(25, 23, 36, 0.5)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--rose-subtle)",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--rose-pink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>Pinned Dashboards</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "2px",
        }}
      >
        {dashboards.map((dash) => {
          const isActive = activeDashboardPath === dash.path;
          const displayName = dash.name.replace(/\.(dashboard\.md|md)$/i, "");
          return (
            <button
              key={dash.path}
              data-testid={`pinned-dashboard-${dash.path}`}
              onClick={() => onSelectDashboard(dash.path)}
              className="tactile-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 500,
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                border: isActive
                  ? "1px solid var(--rose-pink)"
                  : "1px solid rgba(110, 106, 134, 0.25)",
                backgroundColor: isActive
                  ? "rgba(235, 111, 146, 0.2)"
                  : "var(--rose-bg-overlay)",
                color: isActive ? "var(--rose-pink)" : "var(--rose-text)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>{displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
