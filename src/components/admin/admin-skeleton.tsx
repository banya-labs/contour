import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageSkeleton({ rows = 5 }: { rows?: number }) {
  return <main data-admin-skeleton className="min-h-screen bg-editorial-bg px-4 py-6 sm:px-8"><div className="mx-auto max-w-7xl space-y-7"><div className="space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-10 w-80 max-w-full" /><Skeleton className="h-4 w-[32rem] max-w-full" /></div><div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}</div><section className="border border-editorial-border bg-white p-5"><Skeleton className="h-5 w-48" /><div className="mt-5 space-y-3">{Array.from({ length: rows }, (_, item) => <div key={item} className="flex gap-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-24" /></div>)}</div></section></div></main>;
}
