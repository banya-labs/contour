import "../../../lib/load-contour-env";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { contourBrand, getContourAuthConfig } from "@contour/config";

export const dynamic = "force-dynamic";

const clerkKeysConfigured = getContourAuthConfig().isConfigured;

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_30px_90px_rgba(39,26,0,0.10)] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col justify-between gap-10 bg-[linear-gradient(180deg,rgba(39,26,0,0.95),rgba(39,26,0,0.78))] px-8 py-10 text-[color:var(--primary-foreground)] lg:px-12 lg:py-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[color:rgba(253,251,250,0.72)]">
              {contourBrand.name}
            </p>
            <h1 className="mt-5 max-w-xl text-[clamp(2.2rem,3vw,4rem)] font-semibold tracking-[-0.05em]">
              Create the account that powers the cockpit.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-[color:rgba(253,251,250,0.76)]">
              One identity for the web app, desktop app, and future field workflows.
            </p>
          </div>
          <div className="grid gap-3 text-[13px] text-[color:rgba(253,251,250,0.78)] sm:grid-cols-3">
            <div className="rounded-[20px] border border-[color:rgba(253,251,250,0.10)] bg-[color:rgba(253,251,250,0.06)] p-4">
              Team roles
            </div>
            <div className="rounded-[20px] border border-[color:rgba(253,251,250,0.10)] bg-[color:rgba(253,251,250,0.06)] p-4">
              Secure records
            </div>
            <div className="rounded-[20px] border border-[color:rgba(253,251,250,0.10)] bg-[color:rgba(253,251,250,0.06)] p-4">
              Growth-ready
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          {clerkKeysConfigured ? (
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              forceRedirectUrl="/"
            />
          ) : (
            <div className="max-w-md rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-center">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Auth setup pending
              </p>
              <h2 className="mt-3 text-[1.2rem] font-semibold">Clerk keys are not set yet.</h2>
              <p className="mt-3 text-[14px] leading-7 text-[color:var(--muted)]">
                Add `CONTOUR_AUTH_CLERK_SECRET_KEY` and `NEXT_PUBLIC_CONTOUR_AUTH_CLERK_PUBLISHABLE_KEY` to enable the real sign-up flow.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 text-[13px] font-medium text-[color:var(--primary-foreground)]"
              >
                Return home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
