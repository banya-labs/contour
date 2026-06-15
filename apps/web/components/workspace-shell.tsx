import type { ReactNode } from "react";
import { unstable_cache } from "next/cache";
import { getContourSyncSnapshot } from "@contour/db";
import { WorkspaceSidebar } from "./workspace-sidebar";

type WorkspaceShellProps = {
  children: ReactNode;
};

const getCachedSyncSnapshot = unstable_cache(
  async () => getContourSyncSnapshot().catch(() => null),
  ["contour-sync-snapshot"],
  {
    revalidate: 15,
  },
);

export async function WorkspaceShell({ children }: WorkspaceShellProps) {
  const syncSnapshot = await getCachedSyncSnapshot();

  return (
    <div className="min-h-screen px-4 py-4 text-[color:var(--foreground)] lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4 lg:gap-5">
        <WorkspaceSidebar lastSyncAt={syncSnapshot?.lastSyncAt ?? null} />
        <main className="flex min-w-0 flex-1 flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
