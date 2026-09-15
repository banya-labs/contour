"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Scale, ShieldCheck } from "lucide-react";

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
  const [country, setCountry] = useState("ZM");
  const [currency, setCurrency] = useState("ZMW");
  const [agencyType, setAgencyType] = useState("BROKERAGE");
  const [city, setCity] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Statutory Zambia Regulatory & DPA Declarations
  const [pacraNumber, setPacraNumber] = useState("");
  const [ziereaNumber, setZiereaNumber] = useState("");
  const [dpoName, setDpoName] = useState("");
  const [dpoEmail, setDpoEmail] = useState("");
  const [regulatoryDeclarationAgreed, setRegulatoryDeclarationAgreed] = useState(false);

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

    async function checkInvitationsAndMembership() {
      try {
        // First, check if user has a pending invitation to claim or active membership
        const claimRes = await fetch("/api/organization/invitations/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const claimData = await claimRes.json().catch(() => null);

        if (cancelled) return;

        if (claimData?.success && (claimData.claimed || claimData.hasMembership || claimData.isAlreadyMember) && claimData.organizationId) {
          await authClient.organization.setActive({
            organizationId: claimData.organizationId,
          });
          const target = claimData.destination || (claimData.roleKey === "FIELD_AGENT" ? "/agent" : redirectUrl);
          router.replace(target);
          router.refresh();
          return;
        }

        // Fallback: Check existing organizations from Better Auth client
        const result = await authClient.organization.list();
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
      } catch {
        if (!cancelled) {
          setIsLoadingOrganizations(false);
        }
      }
    }

    void checkInvitationsAndMembership();

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
    if (!regulatoryDeclarationAgreed) {
      setError("Statutory Regulatory Declaration required: You must certify PACRA standing, FIC AML compliance, and DPA adherence to activate this workspace.");
      setIsSubmitting(false);
      return;
    }

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

      const profileResponse = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: organizationName.trim(),
          slug: slugify(slug),
          country,
          currency,
          agencyType,
          city,
          pacraRegistrationNumber: pacraNumber.trim() || undefined,
          ziereaLicenseNumber: ziereaNumber.trim() || undefined,
          dpoName: dpoName.trim() || undefined,
          dpoEmail: dpoEmail.trim() || undefined,
          regulatoryDeclarationAgreed: true,
        }),
      });
      if (!profileResponse.ok) {
        const profileError = await profileResponse.json().catch(() => null) as { error?: string } | null;
        setError(profileError?.error || "Workspace created, but profile setup needs to be retried.");
        setIsSubmitting(false);
        return;
      }

      if (logoFile) {
        const logoForm = new FormData();
        logoForm.append("file", logoFile);
        const logoResponse = await fetch("/api/organization/logo", { method: "POST", body: logoForm });
        if (!logoResponse.ok) {
          const logoError = await logoResponse.json().catch(() => null) as { error?: string } | null;
          setError(logoError?.error || "Workspace created, but the logo upload needs to be retried.");
          setIsSubmitting(false);
          return;
        }
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
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">Workspace logo (optional)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
              className="w-full border border-editorial-border px-3 py-2.5 text-xs text-editorial-black file:mr-3 file:border-0 file:bg-editorial-black file:px-3 file:py-2 file:text-[10px] file:font-bold file:uppercase file:text-white"
            />
            <span className="block text-[11px] text-editorial-muted">PNG, JPG, WebP, or SVG up to 2 MB.</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-2">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">Market</span>
              <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black">
                <option value="ZM">Zambia</option><option value="ZA">South Africa</option><option value="ZW">Zimbabwe</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">Currency</span>
              <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black">
                <option value="ZMW">ZMW</option><option value="ZAR">ZAR</option><option value="USD">USD</option>
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">Agency type</span>
            <select value={agencyType} onChange={(event) => setAgencyType(event.target.value)} className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black">
              <option value="BROKERAGE">Brokerage</option><option value="PROPERTY_MANAGEMENT">Property management</option><option value="DEVELOPER">Developer</option><option value="LANDLORD">Landlord</option><option value="MIXED">Mixed</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">City (optional)</span>
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Lusaka" className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black outline-none focus:border-editorial-black" />
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

          {/* Statutory Zambia Regulatory & Compliance Declaration */}
          <div className="border-l-2 border-contour-red border-y border-r border-editorial-border bg-[#fffaf8] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-contour-red" />
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black">
                  Regulatory & Compliance Standing
                </span>
              </div>
              <span className="text-[10px] font-mono bg-white border border-editorial-border px-1.5 py-0.5 text-editorial-muted">
                DPA 2021 & Cap 187
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                  PACRA Reg. Number *
                </span>
                <input
                  required
                  value={pacraNumber}
                  onChange={(e) => setPacraNumber(e.target.value)}
                  placeholder="e.g. 120240012345"
                  className="w-full bg-white border border-editorial-border px-2.5 py-2 text-xs text-editorial-black outline-none focus:border-editorial-black"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                  ZIEREA License No. (optional)
                </span>
                <input
                  value={ziereaNumber}
                  onChange={(e) => setZiereaNumber(e.target.value)}
                  placeholder="e.g. ZIER-2026-981"
                  className="w-full bg-white border border-editorial-border px-2.5 py-2 text-xs text-editorial-black outline-none focus:border-editorial-black"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                  Designated DPO Full Name *
                </span>
                <input
                  required
                  value={dpoName}
                  onChange={(e) => setDpoName(e.target.value)}
                  placeholder="e.g. Kondwani Phiri"
                  className="w-full bg-white border border-editorial-border px-2.5 py-2 text-xs text-editorial-black outline-none focus:border-editorial-black"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                  DPO Statutory Email *
                </span>
                <input
                  required
                  type="email"
                  value={dpoEmail}
                  onChange={(e) => setDpoEmail(e.target.value)}
                  placeholder="compliance@agency.zm"
                  className="w-full bg-white border border-editorial-border px-2.5 py-2 text-xs text-editorial-black outline-none focus:border-editorial-black"
                />
              </label>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="regulatory-declaration"
                required
                checked={regulatoryDeclarationAgreed}
                onChange={(e) => setRegulatoryDeclarationAgreed(e.target.checked)}
                className="mt-0.5 rounded-none text-contour-red focus:ring-contour-red border-editorial-border"
              />
              <label htmlFor="regulatory-declaration" className="text-[11px] text-editorial-black leading-relaxed cursor-pointer font-geist">
                <strong className="font-heading font-bold uppercase tracking-wider text-editorial-black">Statutory Declaration: </strong>
                I confirm that this agency is incorporated under PACRA, operates in accordance with the <em>Estate Agents Act (Cap 187)</em>, and acknowledges its reporting obligations as a designated entity under the <em>Financial Intelligence Centre (FIC) Act</em> and <em>Zambia Data Protection Act No. 3 of 2021</em>.
              </label>
            </div>
          </div>

          {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !regulatoryDeclarationAgreed}
            className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-contour-red" />
            <span>{isSubmitting ? "Creating workspace..." : "Affirm & Continue to Contour"}</span>
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
