import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardSectionWidget } from "../DashboardSectionWidget";
import { DashboardSectionResult } from "../../../types/dashboard";

describe("DashboardSectionWidget Component", () => {
  const mockSection: DashboardSectionResult = {
    sectionId: "sec-test",
    sectionTitle: "In Progress Tasks",
    groups: [
      {
        id: "folder-1",
        title: "Projects/Client-A",
        groupKey: "Projects/Client-A",
        tasks: [
          {
            id: "t-1",
            nodeKey: "nk-1",
            title: "Fix crash on startup #urgent",
            sourceFile: "Projects/Client-A/App.md",
            state: "in_progress",
            tags: ["#urgent"],
            folderPath: "Projects/Client-A",
            noteName: "App.md",
            lineIndex: 5,
          },
        ],
      },
      {
        id: "folder-2",
        title: "Projects/Client-B",
        groupKey: "Projects/Client-B",
        tasks: [
          {
            id: "t-2",
            nodeKey: "nk-2",
            title: "Refactor API client",
            sourceFile: "Projects/Client-B/Api.md",
            state: "open",
            tags: [],
            folderPath: "Projects/Client-B",
            noteName: "Api.md",
            lineIndex: 12,
          },
        ],
      },
    ],
  };

  it("renders section title, filter badges, and total task count badge", () => {
    render(
      <DashboardSectionWidget
        section={mockSection}
        filterConfig={{
          folder: "Projects",
          state: ["in_progress"],
          tags: ["#urgent"],
        }}
        onToggleTaskState={vi.fn()}
      />
    );

    expect(screen.getByText("In Progress Tasks")).toBeInTheDocument();
    expect(screen.getByTestId("section-count-sec-test")).toHaveTextContent(
      "2 tasks"
    );
    expect(screen.getByText("📁 Projects")).toBeInTheDocument();
    expect(screen.getByText("⚙ in_progress")).toBeInTheDocument();
    expect(screen.getByText("🏷 #urgent")).toBeInTheDocument();
  });

  it("renders collapsible group headers and toggles collapse state", () => {
    render(
      <DashboardSectionWidget
        section={mockSection}
        onToggleTaskState={vi.fn()}
      />
    );

    expect(screen.getByText(/Projects\/Client-A/)).toBeInTheDocument();
    expect(screen.getByText(/Projects\/Client-B/)).toBeInTheDocument();
    expect(
      screen.getByText("Fix crash on startup #urgent")
    ).toBeInTheDocument();
    expect(screen.getByText("Refactor API client")).toBeInTheDocument();

    // Click group header to collapse
    const groupHeader = screen.getByText(/Projects\/Client-A/);
    fireEvent.click(groupHeader);

    expect(
      screen.queryByText("Fix crash on startup #urgent")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Refactor API client")).toBeInTheDocument();
  });

  it("renders empty state placeholder when section has 0 tasks", () => {
    const emptySection: DashboardSectionResult = {
      sectionId: "sec-empty",
      sectionTitle: "Completed Work",
      groups: [],
    };

    render(
      <DashboardSectionWidget
        section={emptySection}
        onToggleTaskState={vi.fn()}
      />
    );

    expect(screen.getByTestId("empty-section-sec-empty")).toHaveTextContent(
      "No tasks matching query filters"
    );
  });
});
