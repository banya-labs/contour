"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient, signOut } from "@/lib/auth-client";
import {
  authTransitionCopy,
  shouldBlockAuthSurface,
  type AuthTransitionStage,
} from "@/lib/auth-transition";
import { ContourTransitionScreen } from "@/components/ui/contour-transition-screen";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { AlertCircle } from "lucide-react";

type AuthMode = "sign-in" | "sign-up";

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

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<AuthTransitionStage>("IDLE");

  const isSignUp = mode === "sign-up";
  const rawRedirectUrl = searchParams.get("redirect_url") || "/dashboard";
  const redirectUrl =
    rawRedirectUrl === "/agent/kiosk" || rawRedirectUrl === "/kiosk/agent"
      ? "/agent"
      : rawRedirectUrl;
  const onboardingUrl = isSignUp
    ? `/onboarding?flow=new_agency&redirect_url=${encodeURIComponent(redirectUrl)}`
    : `/onboarding?redirect_url=${encodeURIComponent(redirectUrl)}`;
  const noticeParam = searchParams.get("notice");
  const isAgentPwaIntent = redirectUrl.startsWith("/agent") || redirectUrl.startsWith("/kiosk");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      setStage(isSignUp ? "CREATING_ACCOUNT" : "AUTHENTICATING");
      const result = isSignUp
        ? await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: onboardingUrl,
          })
        : await authClient.signIn.email({
            email,
            password,
            rememberMe: true,
            callbackURL: onboardingUrl,
          });

      if (result.error) {
        let friendly =
          result.error.message || "Authentication failed. Please try again.";
        if (friendly.toLowerCase().includes("invalid email or password")) {
          friendly = isSignUp
            ? "Unable to create account. An account with this email may already exist, or credentials were invalid."
            : "Invalid email or password. If you do not have an agency workspace yet, please register your agency or check your invitation link.";
        }
        setStage("ERROR");
        setError(friendly);
        return;
      }

      setStage("CLAIMING_INVITATION");
      const claimRes = await fetch("/api/organization/invitations/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const claimData = await claimRes.json().catch(() => null);
      if (claimData?.success && (claimData.claimed || claimData.hasMembership || claimData.isAlreadyMember)) {
        if (claimData.organizationId) {
          setStage("ACTIVATING_ORGANIZATION");
          await authClient.organization.setActive({ organizationId: claimData.organizationId });
        }
        const target = claimData.destination || (claimData.roleKey === "FIELD_AGENT" ? "/agent" : redirectUrl);
        setStage("NAVIGATING");
        window.location.href = target;
        return;
      }
    } catch {
      // Fallback to onboarding resolution
    }

    // Redirect to onboarding to resolve membership or create agency (avoids middleware loop)
    setStage("NAVIGATING");
    window.location.href = onboardingUrl;
  }

  async function handleQuickLogin(quickEmail: string) {
    setError(null);
    setEmail(quickEmail);
    setPassword("Password123!");
    setStage("AUTHENTICATING");
    const result = await authClient.signIn.email({
      email: quickEmail,
      password: "Password123!",
      rememberMe: true,
    });
    if (result.error) {
      setStage("ERROR");
      setError(result.error.message || "Quick sign-in failed.");
      return;
    }

    const rawTarget = searchParams.get("redirect_url");
    let targetUrl = rawTarget === "/agent/kiosk" || rawTarget === "/kiosk/agent" ? "/agent" : rawTarget;
    try {
      setStage("CLAIMING_INVITATION");
      const claimRes = await fetch("/api/organization/invitations/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const claimData = await claimRes.json().catch(() => null);
      if (claimData?.success) {
        if (claimData.organizationId) {
          setStage("ACTIVATING_ORGANIZATION");
          await authClient.organization.setActive({ organizationId: claimData.organizationId });
        }
        if (!targetUrl || targetUrl === "/dashboard") {
          targetUrl = claimData.destination || (claimData.roleKey === "FIELD_AGENT" ? "/agent" : "/dashboard");
        }
      }
    } catch {
      // fallback
    }

    if (!targetUrl) {
      targetUrl = quickEmail === "tembo@contour.app" || quickEmail.toLowerCase().includes("agent") ? "/agent" : "/dashboard";
    }
    setStage("NAVIGATING");
    window.location.href = targetUrl;
  }

  async function handleGoogleSignIn() {
    setError(null);
    setStage("AUTHENTICATING");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: onboardingUrl,
      });

      if (result.error) {
        setStage("ERROR");
        setError(
          result.error.message ||
            (result.error.status
              ? `Google authentication failed (${result.error.status}${result.error.statusText ? `: ${result.error.statusText}` : ""}). Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in Dokploy.`
              : "Google authentication is not configured. Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in Dokploy.")
        );
      }
    } catch (caught) {
      setStage("ERROR");
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to initiate Google sign in.",
      );
    }
  }

  const isTransitioning = shouldBlockAuthSurface(stage);

  if (isTransitioning) {
    const copy = authTransitionCopy(stage);
    return (
      <ContourTransitionScreen
        label={copy.label}
        description={copy.description}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Notice Banner from query parameters */}
      {noticeParam === "no_organization" && (
        <div className="border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">No Agency Membership Found</p>
            <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
              Your account is not linked to any agency. Please sign in with your registered agency credentials, request an invite from your manager, or register a new agency below.
            </p>
          </div>
        </div>
      )}

      {/* Field Agent PWA Contextual Header */}
      {isAgentPwaIntent && (
        <div className="border border-emerald-900/30 bg-[#0F1B14] p-3 text-white space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Field Agent Gateway // Lusaka Operations
            </p>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            Sign in with your registered email or Google account to access the Lusaka Field Agent Mobile PWA.
          </p>
        </div>
      )}

      {/* Active Session Status */}
      {session?.user && (
        <div className="border border-emerald-300 bg-emerald-50/70 p-3 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px]">
              Signed in as <strong className="font-mono">{session.user.email}</strong>
            </p>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.refresh();
              }}
              className="text-[10px] text-stone-500 hover:text-stone-900 underline font-mono"
            >
              Sign out
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = onboardingUrl;
            }}
            className="w-full bg-editorial-black text-white px-3 py-2 text-[11px] font-heading font-bold uppercase tracking-wider hover:bg-contour-red transition-colors"
          >
            Continue to workspace / Onboarding →
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={shouldBlockAuthSurface(stage)}
        aria-busy={shouldBlockAuthSurface(stage)}
        className="flex w-full items-center justify-center gap-2 border border-editorial-black bg-white px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors"
      >
        <PendingButtonContent
          pending={isTransitioning}
          pendingLabel="Opening secure Google sign-in…"
          icon={<GoogleLogo />}
        >
          Continue with Google
        </PendingButtonContent>
      </button>

      {/* Dev Quick-Login Bar for Fast Agent Switching */}
      {process.env.NODE_ENV !== "production" && !isSignUp && (
        <div className="border border-stone-300 bg-stone-50 p-3 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
            Fast Dev Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("tembo@contour.app")}
              className="px-2.5 py-2 border border-stone-300 bg-white text-[11px] font-bold text-left hover:bg-stone-100 transition-colors"
            >
              <span className="block text-editorial-black font-serif">Tembo Mwape</span>
              <span className="text-[9px] text-stone-500 font-mono">Field Agent</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("grace@contour.app")}
              className="px-2.5 py-2 border border-stone-300 bg-white text-[11px] font-bold text-left hover:bg-stone-100 transition-colors"
            >
              <span className="block text-editorial-black font-serif">Grace Banda</span>
              <span className="text-[9px] text-stone-500 font-mono">Broker Manager</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-editorial-muted">
        <span className="h-px flex-1 bg-editorial-border" />
        <span>or sign in with credentials</span>
        <span className="h-px flex-1 bg-editorial-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <label className="block space-y-1.5">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">
              Full name
            </span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black outline-none focus:border-editorial-black"
            />
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">
            Email address
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black outline-none focus:border-editorial-black"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-black">
            Password
          </span>
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="w-full border border-editorial-border px-3 py-3 text-sm text-editorial-black outline-none focus:border-editorial-black"
          />
        </label>

        {error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={shouldBlockAuthSurface(stage)}
          aria-busy={shouldBlockAuthSurface(stage)}
          className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PendingButtonContent
            pending={shouldBlockAuthSurface(stage)}
            pendingLabel={isSignUp ? "Creating your account…" : "Signing you in…"}
          >
            {isSignUp ? "Create account" : "Sign in"}
          </PendingButtonContent>
        </button>
      </form>

      {/* Switch between Sign In and Sign Up */}
      <div className="pt-3 border-t border-editorial-border text-center space-y-2 text-xs text-editorial-muted">
        {isSignUp ? (
          <p>
            Already have an account or invitation?{" "}
            <Link
              href={`/sign-in${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
              className="font-bold text-editorial-black underline hover:text-contour-red"
            >
              Sign in here
            </Link>
          </p>
        ) : (
          <div className="space-y-1.5">
            <p>
              Don&apos;t have an agency account yet?{" "}
              <Link
                href={`/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                className="font-bold text-editorial-black underline hover:text-contour-red"
              >
                Register a new agency
              </Link>
            </p>
            <p className="text-[11px] text-editorial-muted">
              Field agent? Ask your agency manager to invite you or share an invite link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
