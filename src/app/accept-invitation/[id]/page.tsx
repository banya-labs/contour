"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ContourLogo } from "@/components/brand/contour-logo";
import { Building2, ShieldCheck, UserCheck, ArrowRight, CheckCircle2 } from "lucide-react";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.85-1.7 2.9-4.2 2.9-7.26Z" />
      <path fill="#34A853" d="M12 21.6c2.64 0 4.86-.87 6.48-2.36l-3.15-2.45c-.87.58-1.98.92-3.33.92-2.56 0-4.73-1.73-5.51-4.05H3.23v2.53A9.79 9.79 0 0 0 12 21.6Z" />
      <path fill="#FBBC05" d="M6.49 13.66a5.88 5.88 0 0 1 0-3.32V7.81H3.23a9.6 9.6 0 0 0 0 8.38l3.26-2.53Z" />
      <path fill="#EA4335" d="M12 6.29c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.85 3.38 14.63 2.4 12 2.4a9.79 9.79 0 0 0-8.77 5.41l3.26 2.53C7.27 8.02 9.44 6.29 12 6.29Z" />
    </svg>
  );
}

type InvitationDetails = {
  id: string;
  email: string;
  roleKey: string;
  roleName: string;
  roleDescription: string;
  organizationName: string;
  organizationSlug: string;
  inviterName: string;
  expiresAt: string;
};

type CurrentMemberInfo = {
  email: string;
  name: string;
  roleKey: string;
  roleName: string;
  isAdminOrOwner: boolean;
  status: string;
  destination: string;
};

function AcceptInvitationContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const invitationId = params.id;
  const token = searchParams.get("token") || "";

  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);
  const [currentMember, setCurrentMember] = useState<CurrentMemberInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Email form state for unauthenticated users
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Fetch invitation details
  useEffect(() => {
    if (!invitationId) return;

    let cancelled = false;
    const url = `/api/organization/invitations/claim?id=${encodeURIComponent(invitationId)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

    void fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.invitation) {
          setInvitation(data.invitation);
          if (!data.invitation.email.endsWith("@invite.contour.app")) {
            setEmail(data.invitation.email);
          }
          if (data.isAlreadyMember && data.currentMember) {
            setIsAlreadyMember(true);
            setCurrentMember(data.currentMember);
          }
        } else {
          setError(data.error || "Unable to load invitation details.");
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error loading invitation.");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [invitationId, token, session]);

  // 2. Claim handler for authenticated user
  const handleClaim = async (confirmRoleChange = false) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/organization/invitations/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, token, confirmRoleChange }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Failed to claim invitation.");
        setIsProcessing(false);
        return;
      }

      // Activate organization in Better Auth client
      if (data.organizationId) {
        await authClient.organization.setActive({ organizationId: data.organizationId });
      }

      const destination = data.destination || (data.roleKey === "FIELD_AGENT" ? "/agent" : "/dashboard");
      router.replace(destination);
      router.refresh();
    } catch {
      setError("An unexpected error occurred while joining the workspace.");
      setIsProcessing(false);
    }
  };

  // 3. Google OAuth trigger
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const callbackURL = typeof window !== "undefined" ? window.location.href : `/accept-invitation/${invitationId}`;
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    if (result.error) {
      setAuthError(result.error.message || "Google authentication failed.");
    }
  };

  // 4. Email/password authentication submit
  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsProcessing(true);

    const callbackURL = typeof window !== "undefined" ? window.location.href : `/accept-invitation/${invitationId}`;

    const result = authMode === "sign-up"
      ? await authClient.signUp.email({
          name: name.trim() || invitation?.email.split("@")[0] || "Agent",
          email: email.trim(),
          password,
          callbackURL,
        })
      : await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL,
        });

    if (result.error) {
      setAuthError(result.error.message || "Authentication failed. Please check your credentials.");
      setIsProcessing(false);
      return;
    }
  };

  if (isLoading || isSessionPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-sm text-editorial-muted">
        Verifying workspace invitation...
      </main>
    );
  }

  if (error && !invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <section className="w-full max-w-md border border-editorial-border bg-white p-8 text-center shadow-sm">
          <ContourLogo size="md" variant="dark" />
          <h1 className="mt-6 font-display text-2xl text-editorial-black">Invitation Invalid or Expired</h1>
          <p className="mt-2 text-xs leading-relaxed text-editorial-muted">{error}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="mt-6 w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white"
          >
            Go to Sign In
          </button>
        </section>
      </main>
    );
  }

  const isGenericInvite = invitation?.email?.endsWith("@invite.contour.app");

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <section className="w-full max-w-lg border border-editorial-border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-editorial-border">
          <ContourLogo size="sm" variant="dark" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider bg-neutral-100 border border-editorial-border px-2 py-0.5 text-editorial-black">
            Official Invitation
          </span>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-contour-red">
            Team Invitation
          </p>
          <h1 className="font-display text-3xl text-editorial-black">
            Join {invitation?.organizationName}
          </h1>
          <p className="text-xs text-editorial-muted leading-relaxed">
            {invitation?.inviterName} has invited you to join the agency workspace on Contour.
          </p>
        </div>

        {/* Invited Role Summary Card */}
        <div className="mt-6 border border-editorial-border bg-neutral-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">
              Assigned Role
            </span>
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 bg-white border border-editorial-border text-editorial-black">
              {invitation?.roleName}
            </span>
          </div>
          <p className="text-xs text-editorial-muted">{invitation?.roleDescription}</p>
          {!isGenericInvite && (
            <div className="pt-2 border-t border-editorial-border text-[11px] text-editorial-black font-mono">
              Invited email: <strong className="text-editorial-black">{invitation?.email}</strong>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {/* State A: Authenticated User ALREADY a Member of this Workspace */}
        {isAlreadyMember && currentMember ? (
          <div className="mt-6 space-y-4">
            <div className="border border-editorial-black bg-neutral-50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
                  Already a Workspace Member
                </h3>
              </div>
              <p className="text-xs text-editorial-black leading-relaxed">
                Your email address (<strong>{session?.user?.email}</strong>) is already part of{" "}
                <strong>{invitation?.organizationName}</strong> as{" "}
                <span className="font-semibold text-contour-red font-mono">
                  {currentMember.roleName}
                </span>
                . You do not need to join again.
              </p>
            </div>

            {currentMember.isAdminOrOwner ? (
              <div className="space-y-3">
                <div className="p-3 border border-amber-200 bg-amber-50 text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold">Administrator Protection</p>
                  <p className="mt-0.5 text-[11px]">
                    As an administrator of this agency, you cannot change your role to{" "}
                    <strong>{invitation?.roleName}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(currentMember.destination || "/dashboard")}
                  className="w-full bg-editorial-black px-4 py-3.5 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Go to Agency Dashboard</span>
                </button>
              </div>
            ) : currentMember.roleKey === invitation?.roleKey ? (
              <div className="space-y-3">
                <p className="text-xs text-editorial-muted">
                  You already hold the <strong>{invitation?.roleName}</strong> role in this workspace.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(currentMember.destination || (currentMember.roleKey === "FIELD_AGENT" ? "/agent" : "/dashboard"))}
                  className="w-full bg-editorial-black px-4 py-3.5 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red flex items-center justify-center gap-2"
                >
                  <span>Continue to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 border border-editorial-border p-4 bg-white">
                <p className="text-xs text-editorial-black">
                  This invite link is for the <strong>{invitation?.roleName}</strong> role. Would you like to switch your role to <strong>{invitation?.roleName}</strong>?
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push(currentMember.destination || (currentMember.roleKey === "FIELD_AGENT" ? "/agent" : "/dashboard"))}
                    className="flex-1 border border-editorial-border bg-white px-3 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 text-center"
                  >
                    Keep Role ({currentMember.roleName})
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleClaim(true)}
                    className="flex-1 bg-editorial-black px-3 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-contour-red disabled:opacity-50 text-center"
                  >
                    {isProcessing ? "Updating..." : `Switch to ${invitation?.roleName}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : session?.user ? (
          /* State B: Authenticated User NOT a Member Yet */
          <div className="mt-6 space-y-4">
            <div className="border border-emerald-300 bg-emerald-50/60 p-4 text-xs">
              <p className="font-bold text-emerald-950">Signed in as {session.user.email}</p>
              {!isGenericInvite && session.user.email?.toLowerCase() !== invitation?.email?.toLowerCase() && (
                <p className="mt-1 text-amber-800 text-[11px]">
                  Note: You are signed in as {session.user.email}. Accepting will connect this account to {invitation?.organizationName}.
                </p>
              )}
            </div>

            <button
              onClick={() => handleClaim(false)}
              disabled={isProcessing}
              className="w-full bg-editorial-black px-4 py-3.5 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isProcessing ? "Joining workspace..." : `Accept & Join as ${invitation?.roleName}`}</span>
            </button>
          </div>
        ) : (
          /* State B: Unauthenticated User */
          <div className="mt-6 space-y-5">
            {/* Primary Google Sign-In Action */}
            <div>
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-editorial-black mb-2">
                Fast Sign-In with Google
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2.5 border border-editorial-black bg-white px-4 py-3.5 text-xs font-heading font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors"
              >
                <GoogleLogo />
                <span>Continue with Google to Accept</span>
              </button>
              <p className="mt-1.5 text-[10px] text-editorial-muted">
                Signs in with your Google account and immediately connects you to {invitation?.organizationName}.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-editorial-muted">
              <span className="h-px flex-1 bg-editorial-border" />
              <span>or accept with password</span>
              <span className="h-px flex-1 bg-editorial-border" />
            </div>

            {/* Email / Password Fallback Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === "sign-up" && (
                <label className="block space-y-1">
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">
                    Full name
                  </span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kondwani Phiri"
                    className="w-full border border-editorial-border px-3 py-2.5 text-xs text-editorial-black outline-none focus:border-editorial-black"
                  />
                </label>
              )}

              <label className="block space-y-1">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">
                  Email address
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-editorial-border px-3 py-2.5 text-xs text-editorial-black outline-none focus:border-editorial-black"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">
                  Password
                </span>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-editorial-border px-3 py-2.5 text-xs text-editorial-black outline-none focus:border-editorial-black"
                />
              </label>

              {authError && (
                <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-contour-red transition-colors disabled:opacity-50"
              >
                {isProcessing
                  ? "Processing..."
                  : authMode === "sign-up"
                  ? "Create Account & Join Agency"
                  : "Sign In & Join Agency"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "sign-up" ? "sign-in" : "sign-up")}
                  className="text-[11px] text-editorial-muted hover:text-editorial-black underline"
                >
                  {authMode === "sign-up"
                    ? "Already have an account? Sign in here"
                    : "Need a new account? Create one here"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-white text-sm text-editorial-muted">Loading invitation...</main>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
