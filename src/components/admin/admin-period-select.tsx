"use client";

import { ADMIN_PERIODS, type AdminPeriod } from "@/lib/admin-control-plane/periods";

export function AdminPeriodSelect({ value, onChange }: { value: AdminPeriod; onChange: (value: AdminPeriod) => void }) {
  return <select aria-label="Reporting period" value={value} onChange={(event) => onChange(event.target.value as AdminPeriod)} className="h-10 border border-editorial-border bg-white px-3 text-xs font-bold uppercase tracking-wider">
    {ADMIN_PERIODS.map((period) => <option key={period} value={period}>{period === "today" ? "Today" : period === "this_week" ? "This week" : period === "this_month" ? "This month" : "This year"}</option>)}
  </select>;
}
