import type { ReactNode } from "react";
import { ControlPlaneTabs } from "@/components/admin/control-plane-tabs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-editorial-bg lg:flex">
      <ControlPlaneTabs />
      <div className="min-w-0 flex-1">
        <div className="border-b border-editorial-border bg-editorial-bg px-4 pt-4 sm:px-8 lg:hidden" />
        {children}
      </div>
    </div>
  );
}
