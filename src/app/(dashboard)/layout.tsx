import React from "react";
import WorkspaceSidebar from "@/components/workspace-sidebar";
import ContourGenUiModal from "@/components/ai/contour-genui-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-paper-100 font-sans">
      <WorkspaceSidebar />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {children}
      </main>
      {/* Global Generative UI Copilot Capsule & Modal */}
      <ContourGenUiModal />
    </div>
  );
}
