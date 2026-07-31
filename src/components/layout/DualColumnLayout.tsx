import React from "react";
import { TaskDashboardSidebar } from "../sidebar/TaskDashboardSidebar";
import { EditorPane } from "../editor/EditorPane";

export const DualColumnLayout: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--rose-bg-base)",
      }}
    >
      <TaskDashboardSidebar />
      <EditorPane />
    </div>
  );
};

export default DualColumnLayout;
