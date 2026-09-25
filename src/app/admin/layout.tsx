import type { ReactNode } from "react";
import { ControlPlaneTabs } from "@/components/admin/control-plane-tabs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-editorial-bg lg:flex">
      <ControlPlaneTabs />
      <div className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</div>
    </div>
  );
}
