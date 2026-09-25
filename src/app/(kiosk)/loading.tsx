import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="min-h-screen bg-[#0F1B14] px-4 py-5 text-white" aria-busy="true" aria-label="Loading field workspace"><div className="mx-auto max-w-xl space-y-5"><div className="flex items-center justify-between"><Skeleton className="h-9 w-32 bg-white/10" /><Skeleton className="h-9 w-9 rounded-full bg-white/10" /></div><Skeleton className="h-28 rounded-2xl bg-white/10" /><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28 rounded-2xl bg-white/10" /><Skeleton className="h-28 rounded-2xl bg-white/10" /></div><Skeleton className="h-72 rounded-2xl bg-white/10" /></div></main>;
}
