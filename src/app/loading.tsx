import { ContourLogo } from "@/components/brand/contour-logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="min-h-screen bg-editorial-bg px-4 py-8 font-geist sm:px-8" aria-busy="true" aria-label="Loading Contour"><div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-between gap-12"><div className="flex items-center justify-between border-b border-editorial-border pb-5"><ContourLogo className="h-8 w-auto" /><Skeleton className="h-8 w-28" /></div><section className="space-y-6"><Skeleton className="h-3 w-44" /><Skeleton className="h-14 w-[34rem] max-w-full" /><Skeleton className="h-5 w-[28rem] max-w-full" /><div className="grid gap-4 pt-6 sm:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div></section><Skeleton className="h-3 w-64" /></div></main>;
}
