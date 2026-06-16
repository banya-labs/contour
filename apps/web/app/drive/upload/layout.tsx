import { WorkspaceShell } from "../../../components/workspace-shell";
import DriveUploadPage from "./page";

export const dynamic = "force-dynamic";

export default function DriveUploadLayout() {
  return (
    <WorkspaceShell>
      <DriveUploadPage />
    </WorkspaceShell>
  );
}
