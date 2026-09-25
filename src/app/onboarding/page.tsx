"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient, signOut } from "@/lib/auth-client";
import { ContourLogo } from "@/components/brand/contour-logo";
import { ContourTransitionScreen } from "@/components/ui/contour-transition-screen";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import {
  authTransitionCopy,
  shouldBlockAuthSurface,
  type AuthTransitionStage,
} from "@/lib/auth-transition";
import {
  Scale,
  ShieldCheck,
  Building2,
  Smartphone,
  ArrowRight,
  RefreshCw,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { shouldCreateWorkspace } from "@/lib/onboarding-workspace";

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

type OnboardingView = "CHECKING" | "NO_ORGANIZATION_DECISION" | "CREATE_WORKSPACE";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirectUrl = searchParams.get("redirect_url");
  const redirectUrl = safeRedirect(rawRedirectUrl);
  const noticeParam = searchParams.get("notice");
  const isNewAgencyFlow = searchParams.get("flow") === "new_agency";
  const isAgentPwaIntent = redirectUrl.startsWith("/agent") || redirectUrl.startsWith("/kiosk");

  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [view, setView] = useState<OnboardingView>(() => isNewAgencyFlow ? "CREATE_WORKSPACE" : "CHECKING");
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("ZM");
  const [currency, setCurrency] = useState("ZMW");
  const [agencyType, setAgencyType] = useState("BROKERAGE");
  const [city, setCity] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Invite lookup & claim state
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);
  const [inviteStatusMessage, setInviteStatusMessage] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [isClaimingInvite, setIsClaimingInvite] = useState(false);

  // Statutory Zambia Regulatory & DPA Declarations
  const [pacraNumber, setPacraNumber] = useState("");
  const [ziereaNumber, setZiereaNumber] = useState("");
  const [dpoName, setDpoName] = useState("");
  const [dpoEmail, setDpoEmail] = useState("");
  const [regulatoryDeclarationAgreed, setRegulatoryDeclarationAgreed] = useState(false);

  const [transitionStage, setTransitionStage] =
    useState<AuthTransitionStage>("IDLE");
  const [error, setError] = useState<string | null>(null);

  async function checkInvitationsAndMembership(manualTrigger = false) {
    if (manualTrigger) {
      setIsCheckingInvite(true);
      setInviteStatusMessage(null);
    }

    try {
      const supportResponse = await fetch("/api/support-access/current", { cache: "no-store" });
      const supportAccess = await supportResponse.json();
      if (supportResponse.ok && supportAccess.active) {
        setTransitionStage("NAVIGATING");
        router.replace(redirectUrl);
        router.refresh();
        return;
      }
      // Do not claim invitations during ordinary onboarding/sign-in. An
      // invitation must be supplied explicitly from its invite URL/code.
      // Otherwise preserve the active organization for multi-tenant accounts.
      const result = await authClient.organization.list();
      if (result.data && result.data.length > 0) {
        const activeOrganizationId = session?.session?.activeOrganizationId;
        const activeOrganization = result.data.find((organization) => organization.id === activeOrganizationId) || (result.data.length === 1 ? result.data[0] : null);
        if (activeOrganization) {
          setTransitionStage("ACTIVATING_ORGANIZATION");
          const activeResult = activeOrganization.id === activeOrganizationId ? { error: null } : await authClient.organization.setActive({ organizationId: activeOrganization.id });
          if (!activeResult.error) {
          setTransitionStage("NAVIGATING");
          router.replace(redirectUrl);
          router.refresh();
          return;
          }
        }
        // Never show the new-workspace form when this account already has
        // memberships. A stale `flow=new_agency` URL must not create another
        // organization on every sign-in.
        setView("NO_ORGANIZATION_DECISION");
        return;
      }

      // 3. User is authenticated, but no active agency membership was found
      if (!isNewAgencyFlow) {
        setView("NO_ORGANIZATION_DECISION");
        if (manualTrigger) {
          const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setInviteStatusMessage({
            type: "info",
            text: `Checked at ${timestamp}: No pending invite found yet for ${session?.user?.email}. Please request an invite from your agency manager.`,
          });
        }
      } else {
        setView("CREATE_WORKSPACE");
      }
    } catch {
      if (!isNewAgencyFlow) {
        setView("NO_ORGANIZATION_DECISION");
        if (manualTrigger) {
          setInviteStatusMessage({
            type: "error",
            text: "Unable to check invitations due to a network error. Please try again.",
          });
        }
      } else {
        setView("CREATE_WORKSPACE");
      }
    } finally {
      if (manualTrigger) {
        setIsCheckingInvite(false);
      }
    }
  }

  useEffect(() => {
    if (isSessionPending) return;
    if (!session) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    void checkInvitationsAndMembership(false);
  }, [isSessionPending, redirectUrl, router, session]);

  // Handle explicit invite code or URL submission
  async function handleClaimInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    setIsClaimingInvite(true);
    setTransitionStage("CLAIMING_INVITATION");
    setInviteStatusMessage(null);

    try {
      const response = await fetch("/api/organization/invitations/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteInput: inviteInput.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setInviteStatusMessage({
          type: "error",
          text: data.error || "The invite link or code provided could not be claimed.",
        });
        setIsClaimingInvite(false);
        setTransitionStage("ERROR");
        return;
      }

      if (data.organizationId) {
        setTransitionStage("ACTIVATING_ORGANIZATION");
        await authClient.organization.setActive({ organizationId: data.organizationId });
      }

      const target = data.destination || (data.roleKey === "FIELD_AGENT" ? "/agent" : redirectUrl);
      setTransitionStage("NAVIGATING");
      router.replace(target);
      router.refresh();
    } catch {
      setInviteStatusMessage({
        type: "error",
        text: "Network error claiming invite. Please check your internet connection.",
      });
      setIsClaimingInvite(false);
      setTransitionStage("ERROR");
    }
  }

  // Handle Sign Out to switch to another account
  async function handleSignOut() {
    await signOut();
    router.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
    router.refresh();
  }

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
      return;
    }

    setTransitionStage("CREATING_WORKSPACE");

    // Re-check immediately before the mutation so a stale onboarding tab or
    // repeated callback cannot create a second workspace for an existing user.
    const memberships = await authClient.organization.list();
    if (!shouldCreateWorkspace(memberships.data?.length || 0)) {
      const activeOrganizationId = session?.session?.activeOrganizationId;
      const organization = memberships.data?.find((item) => item.id === activeOrganizationId) || (memberships.data?.length === 1 ? memberships.data[0] : null);
      if (organization) {
        await authClient.organization.setActive({ organizationId: organization.id });
        router.replace(redirectUrl);
        router.refresh();
        return;
      }
      setError("This account already belongs to an agency. Select that workspace or ask an owner for an invitation.");
      setTransitionStage("ERROR");
      return;
    }

    const result = await authClient.organization.create({
      name: organizationName.trim(),
      slug: slugify(slug),
      keepCurrentActiveOrganization: true,
    });

    if (result.error) {
      setError(result.error.message || "Unable to create your organization.");
      setTransitionStage("ERROR");
      return;
    }

    if (result.data?.id) {
      const activeResult = await authClient.organization.setActive({
        organizationId: result.data.id,
      });
      if (activeResult.error) {
        setError(activeResult.error.message || "Unable to activate your organization.");
        setTransitionStage("ERROR");
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
        setTransitionStage("ERROR");
        return;
      }

      if (logoFile) {
        const logoForm = new FormData();
        logoForm.append("file", logoFile);
        const logoResponse = await fetch("/api/organization/logo", { method: "POST", body: logoForm });
        if (!logoResponse.ok) {
          const logoError = await logoResponse.json().catch(() => null) as { error?: string } | null;
          setError(logoError?.error || "Workspace created, but the logo upload needs to be retried.");
          setTransitionStage("ERROR");
          return;
        }
      }
    }

    setTransitionStage("NAVIGATING");
    router.replace(redirectUrl);
    router.refresh();
  }

  // 1. Initial State: Checking memberships
  if (isSessionPending || (!isNewAgencyFlow && view === "CHECKING")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <SectionPendingState
          label={isNewAgencyFlow ? "Preparing workspace setup…" : "Checking agency access…"}
          description="Connecting your authenticated account to Contour real estate operations."
        />
      </main>
    );
  }

  const isTransitioning = shouldBlockAuthSurface(transitionStage);

  if (isTransitioning) {
    const copy = authTransitionCopy(transitionStage);
    return (
      <ContourTransitionScreen label={copy.label} description={copy.description} />
    );
  }

  // 2. Decision State: User is authenticated, but NO organization or invitation was found
  if (view === "NO_ORGANIZATION_DECISION") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6">
        <section className="w-full max-w-2xl border border-editorial-border bg-white p-6 shadow-sm sm:p-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-editorial-border pb-6">
            <ContourLogo size="sm" variant="dark" />
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-editorial-muted">
                AUTHENTICATED // NO AGENCY LINKED
              </span>
            </div>
          </div>

          {/* Context Banner */}
          {noticeParam === "no_organization" && (
            <div className="mt-6 flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Access restricted: The page you requested requires membership in a registered Contour agency workspace.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <p className="text-[10px] font-heading font-bold uppercase tracking-[0.24em] text-contour-red">
              Agency Workspace Required
            </p>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-editorial-black uppercase tracking-tight">
              No Agency Linked to This Email
            </h1>
            <p className="text-xs text-editorial-muted leading-relaxed">
              You are signed in as <strong className="text-editorial-black font-mono">{session?.user?.email}</strong>,
              but this email address is not currently associated with any registered agency on Contour.
            </p>
          </div>

          {/* Intent Clarification & Two Branch Paths */}
          <div className="mt-8 space-y-6">
            {/* PATH 1: Field Agent / Agency Team Member */}
            <div
              className={`border p-6 transition-all ${
                isAgentPwaIntent
                  ? "border-contour-red bg-[#fffaf8] shadow-sm ring-1 ring-contour-red/20"
                  : "border-editorial-border bg-neutral-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-editorial-border bg-white text-contour-red shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
                        Field Agent or Agency Staff
                      </h2>
                      {isAgentPwaIntent && (
                        <span className="border border-contour-red bg-white px-2 py-0.5 text-[9px] font-heading font-bold uppercase tracking-wider text-contour-red">
                          Target: Agent PWA
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-editorial-muted">
                      Trying to access your agency workspace or the Lusaka Field Agent PWA
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-editorial-border/60 pt-4 space-y-3">
                <p className="text-xs text-editorial-black leading-relaxed">
                  Field agents and team members must be invited by their agency manager. If your agency already uses Contour, your email has not been added to their team yet.
                </p>

                <div className="rounded border border-neutral-200 bg-white p-3 text-xs text-editorial-muted space-y-1.5">
                  <div className="flex items-center gap-2 text-editorial-black font-semibold">
                    <HelpCircle className="h-3.5 w-3.5 text-contour-red" />
                    <span>How to get access:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-editorial-muted">
                    <li>
                      Contact your agency manager or principal broker to add{" "}
                      <strong className="text-editorial-black font-mono">{session?.user?.email}</strong> from their
                      Agency Dashboard.
                    </li>
                    <li>Or ask your manager to send you a direct <strong>Invite Link</strong> (e.g. via WhatsApp).</li>
                  </ul>
                </div>

                {/* Status Message */}
                {inviteStatusMessage && (
                  <div
                    className={`border p-3 text-xs flex items-start gap-2 ${
                      inviteStatusMessage.type === "success"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : inviteStatusMessage.type === "error"
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-blue-300 bg-blue-50 text-blue-900"
                    }`}
                  >
                    {inviteStatusMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <p>{inviteStatusMessage.text}</p>
                  </div>
                )}

                {/* Real-time actions: Check for invite */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => checkInvitationsAndMembership(true)}
                    disabled={isCheckingInvite}
                    className="flex-1 flex items-center justify-center gap-2 border border-editorial-border bg-white px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isCheckingInvite ? "animate-spin text-contour-red" : ""}`} />
                    <span>{isCheckingInvite ? "Checking Invitations..." : "Check for Invite"}</span>
                  </button>
                </div>

                {/* Paste Invite Code / URL Form */}
                <form onSubmit={handleClaimInvite} className="pt-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-editorial-muted" />
                      <input
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        placeholder="Paste invite link or code from your manager..."
                        className="w-full border border-editorial-border bg-white pl-9 pr-3 py-2 text-xs text-editorial-black outline-none focus:border-editorial-black"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isClaimingInvite || !inviteInput.trim()}
                      className="bg-editorial-black px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-contour-red transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isClaimingInvite ? "Claiming..." : "Claim Link"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* PATH 2: Agency Principal / Broker (New Agency Workspace) */}
            <div className="border border-editorial-border bg-white p-6 hover:border-editorial-black transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-editorial-border bg-neutral-50 text-editorial-black shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
                      Register a New Agency
                    </h2>
                    <p className="mt-0.5 text-[11px] text-editorial-muted">
                      For brokerages, property managers, and developers establishing a new Contour tenant
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setView("CREATE_WORKSPACE")}
                  className="bg-editorial-black px-5 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-contour-red transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <span>Create Agency</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Controls: Switch Account & Back to Home */}
          <div className="mt-8 pt-6 border-t border-editorial-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-editorial-muted">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:text-editorial-black transition-colors text-[11px] font-mono"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Signed in as {session?.user?.email} · Click to sign out</span>
            </button>
            <Link href="/" className="text-[11px] hover:text-editorial-black underline">
              ← Return to public website
            </Link>
          </div>
          <p className="mt-4 text-center text-[10px] text-editorial-muted">
            Platform staff without an agency workspace can <Link href="/admin" className="font-semibold underline hover:text-editorial-black">access the Control Plane</Link>.
          </p>
        </section>
      </main>
    );
  }

  // 3. Agency Creation Form State
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <section className="w-full max-w-lg border border-editorial-border bg-white p-8 shadow-sm">
        {/* Back button to intent decision */}
        <button
          type="button"
          onClick={() => setView("NO_ORGANIZATION_DECISION")}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-editorial-muted hover:text-editorial-black font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to agency options</span>
        </button>

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
            disabled={
              shouldBlockAuthSurface(transitionStage) ||
              !regulatoryDeclarationAgreed
            }
            aria-busy={shouldBlockAuthSurface(transitionStage)}
            className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <PendingButtonContent
              pending={isTransitioning}
              pendingLabel="Creating your workspace…"
              icon={<ShieldCheck className="h-4 w-4 text-contour-red" />}
            >
              Affirm &amp; Continue to Contour
            </PendingButtonContent>
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
