"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function safeRedirect(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = safeRedirect(searchParams.get("redirect_url"));
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSessionPending) return;
    if (!session) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent("/onboarding")}`);
      return;
    }

    let cancelled = false;
    void authClient.organization.list().then(async (result) => {
      if (cancelled) return;

      if (result.error) {
        setError(result.error.message || "Unable to load your organizations.");
        setIsLoadingOrganizations(false);
        return;
      }

      const firstOrganization = result.data?.[0];
      if (firstOrganization) {
        const activeResult = await authClient.organization.setActive({
          organizationId: firstOrganization.id,
        });
        if (!activeResult.error) {
          router.replace(redirectUrl);
          router.refresh();
          return;
        }
        setError(activeResult.error.message || "Unable to activate your organization.");
      }

      setIsLoadingOrganizations(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isSessionPending, redirectUrl, router, session]);

  function handleNameChange(value: string) {
    setOrganizationName(value);
    if (!slug || slug === slugify(organizationName)) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.organization.create({
      name: organizationName.trim(),
      slug: slugify(slug),
      keepCurrentActiveOrganization: true,
    });

    if (result.error) {
      setError(result.error.message || "Unable to create your organization.");
      setIsSubmitting(false);
      return;
    }

    if (result.data?.id) {
      const activeResult = await authClient.organization.setActive({
        organizationId: result.data.id,
      });
      if (activeResult.error) {
        setError(activeResult.error.message || "Unable to activate your organization.");
        setIsSubmitting(false);
        return;
      }
    }

    router.replace(redirectUrl);
    router.refresh();
  }

  if (isSessionPending || isLoadingOrganizations) {
    return <main className="flex min-h-screen items-center justify-center bg-white text-sm text-editorial-muted">Preparing your workspace...</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <section className="w-full max-w-lg border border-editorial-border bg-white p-8 shadow-sm">
        <p className="mb-3 text-[10px] font-heading font-bold uppercase tracking-[0.24em] text-contour-red">Contour onboarding</p>
        <h1 className="font-display text-4xl text-editorial-black">Create your workspace</h1>
        <p className="mt-3 text-sm leading-6 text-editorial-muted">
          Your workspace keeps properties, clients, documents, and billing isolated from every other Contour customer.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">Workspace name</span>
            <input
              required
              minLength={2}
              value={organizationName}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Lusaka Property Group"
              className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black outline-none focus:border-editorial-black"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">Workspace URL</span>
            <div className="flex items-center border border-editorial-border px-3 text-sm text-editorial-muted">
              <span>contour/</span>
              <input
                required
                minLength={2}
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                className="min-w-0 flex-1 border-0 px-1 py-3 text-editorial-black outline-none"
              />
            </div>
          </label>

          {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating workspace..." : "Continue to Contour"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-white text-sm text-editorial-muted">Preparing your workspace...</main>}>
      <OnboardingContent />
    </Suspense>
  );
}
