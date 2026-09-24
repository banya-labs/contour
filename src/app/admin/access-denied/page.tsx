import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";

export const dynamic = "force-dynamic";

export default function AdminAccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-editorial-bg px-5 py-12 font-geist text-editorial-black">
      <section className="w-full max-w-lg border border-editorial-border bg-white p-7 shadow-subtle sm:p-10">
        <ContourLogo size="sm" />
        <div className="mt-10 flex h-11 w-11 items-center justify-center border border-editorial-border bg-editorial-paper text-contour-red">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-contour-red">Internal access // restricted</p>
        <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight">Control Plane access not granted</h1>
        <p className="mt-4 text-sm leading-6 text-editorial-muted">Your account is authenticated, but it does not have internal Contour operations access. Contact Contour management if you believe this is incorrect.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="bg-editorial-black px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-contour-red">Return to workspace</Link>
          <Link href="/sign-in" className="border border-editorial-border px-4 py-3 text-xs font-bold uppercase tracking-wider text-editorial-black hover:border-contour-red">Use another account</Link>
        </div>
      </section>
    </main>
  );
}
