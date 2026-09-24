import Link from "next/link";

export default async function AccountLockedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status === "SUSPENDED" ? "suspended" : resolvedSearchParams.status === "DELETION_PENDING" ? "scheduled for review" : "temporarily locked";
  return <main className="flex min-h-screen items-center justify-center bg-editorial-bg px-6 py-12"><div className="max-w-lg border border-editorial-border bg-white p-8 text-center shadow-subtle"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-red">Contour account status</p><h1 className="mt-3 font-serif text-3xl font-bold">Workspace {status}</h1><p className="mt-4 text-sm leading-6 text-editorial-muted">This workspace is not currently available to its members. Contact Contour support if you believe this status is incorrect or need help with recovery.</p><Link href="/sign-in" className="mt-6 inline-flex bg-editorial-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-editorial-red">Return to sign in</Link></div></main>;
}
