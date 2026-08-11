import { useState, useEffect } from "react";
import DualColumnLayout from "./components/layout/DualColumnLayout";
import { getWorkspaceDir } from "./services/fileService";

function App() {
  const [workspaceDir, setWorkspaceDir] = useState<string | null>(null);

  useEffect(() => {
    getWorkspaceDir().then(setWorkspaceDir);
  }, []);

  if (!workspaceDir) return null;

  return <DualColumnLayout workspaceDir={workspaceDir} />;
}

export default App;
