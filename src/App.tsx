import { useState, useEffect } from "react";
import DualColumnLayout from "./components/layout/DualColumnLayout";
import { getWorkspaceDir } from "./services/fileService";
import UpdateNotification from "./components/ui/UpdateNotification";

function App() {
  const [workspaceDir, setWorkspaceDir] = useState<string | null>(null);

  useEffect(() => {
    getWorkspaceDir().then(setWorkspaceDir);
  }, []);

  if (!workspaceDir) return null;

  return (
    <>
      <DualColumnLayout workspaceDir={workspaceDir} />
      <UpdateNotification />
    </>
  );
}

export default App;
