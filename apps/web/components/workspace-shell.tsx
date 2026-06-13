import type { ReactNode } from "react";
import { WorkspaceSidebar } from "./workspace-sidebar";

type WorkspaceShellProps = {
  children: ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen px-4 py-4 text-[color:var(--foreground)] lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4 lg:gap-5">
        <WorkspaceSidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
