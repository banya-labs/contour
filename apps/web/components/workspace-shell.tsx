import type { ReactNode } from "react";
import { getContourSyncSnapshot } from "@contour/db";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { ConnectivityBadge } from "./connectivity-badge";

type WorkspaceShellProps = {
  children: ReactNode;
};

export async function WorkspaceShell({ children }: WorkspaceShellProps) {
  const syncSnapshot = await getContourSyncSnapshot().catch(() => null);

  return (
    <div className="min-h-screen px-4 py-4 text-[color:var(--foreground)] lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] flex-col gap-4 lg:gap-5">
        <div className="flex items-center justify-between rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 shadow-[0_12px_30px_rgba(39,26,0,0.04)]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-[color:var(--muted)]">Workspace status</p>
            <p className="mt-1 text-[13px] font-medium">Contour operations shell</p>
          </div>
          <ConnectivityBadge lastSyncAt={syncSnapshot?.lastSyncAt ?? null} />
        </div>
        <div className="flex min-h-0 flex-1 gap-4 lg:gap-5">
          <WorkspaceSidebar />
          <main className="flex min-w-0 flex-1 flex-col gap-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
