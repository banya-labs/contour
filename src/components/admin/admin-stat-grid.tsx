import { Skeleton } from "@/components/ui/skeleton";

export type AdminStat = { label: string; value: string; note?: string };

export function AdminStatGrid({ stats, loading = false }: { stats: AdminStat[]; loading?: boolean }) {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Control plane statistics">{loading ? [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />) : stats.map((stat) => <article key={stat.label} className="border border-editorial-border bg-white p-5 shadow-subtle"><p className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted">{stat.label}</p><p className="mt-3 font-mono text-2xl font-bold">{stat.value}</p>{stat.note && <p className="mt-1 text-xs text-editorial-muted">{stat.note}</p>}</article>)}</section>;
}
