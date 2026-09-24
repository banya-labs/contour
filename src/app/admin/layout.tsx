import type { ReactNode } from "react";
import { ControlPlaneTabs } from "@/components/admin/control-plane-tabs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-editorial-border bg-editorial-bg px-4 pt-4 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-7xl">
          <ControlPlaneTabs />
        </div>
      </div>
      {children}
    </>
  );
}

