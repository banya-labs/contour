import Link from "next/link";
import { ContourLogo } from "@/components/brand/contour-logo";

export default function AdminAccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-editorial-bg px-5 py-12 font-geist text-editorial-black">
      <section className="w-full max-w-md text-center">
        <div className="flex justify-center"><ContourLogo size="sm" /></div>
        <p className="mt-14 text-[10px] font-bold uppercase tracking-[0.25em] text-contour-red">Access denied</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase tracking-tight">You seem to be lost</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-editorial-muted">You do not have access to this area of Contour.</p>
        <Link href="/dashboard" className="mt-8 inline-flex bg-editorial-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-contour-red">Return to workspace</Link>
      </section>
    </main>
  );
}
