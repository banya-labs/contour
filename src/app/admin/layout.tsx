import type { ReactNode } from "react";
import { ControlPlaneTabs } from "@/components/admin/control-plane-tabs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-editorial-bg lg:flex"><div className="border-b border-editorial-border px-4 pt-4 sm:px-8 lg:border-b-0 lg:px-6 lg:py-6"><ControlPlaneTabs /></div><div className="min-w-0 flex-1">{children}</div></div>
  );
}

