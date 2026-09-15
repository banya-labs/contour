"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";
  const onboardingUrl = `/onboarding?redirect_url=${encodeURIComponent(redirectUrl)}`;
  const isSignUp = mode === "sign-up";
  const isLocalDevelopment =
    !redirectUrl.startsWith("/agent") &&
    !redirectUrl.startsWith("/kiosk") &&
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_MODE === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    setIsSubmitting(true);

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
          callbackURL: onboardingUrl,
        });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message || "Authentication failed. Please try again.");
      return;
    }

    try {
      const claimRes = await fetch("/api/organization/invitations/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const claimData = await claimRes.json().catch(() => null);
      if (claimData?.success && (claimData.claimed || claimData.hasMembership)) {
        if (claimData.organizationId) {
          await authClient.organization.setActive({ organizationId: claimData.organizationId });
        }
        const target = claimData.destination || (claimData.roleKey === "FIELD_AGENT" ? "/agent" : redirectUrl);
        router.replace(target);
        router.refresh();
        return;
      }
    } catch {
      // Fallback to normal redirection
    }

    router.replace(redirectUrl);
    router.refresh();
  }

  async function handleQuickLogin(quickEmail: string) {
    setError(null);
    setEmail(quickEmail);
    setPassword("Password123!");
    setIsSubmitting(true);
    console.log("[handleQuickLogin] signing in:", quickEmail);
    const result = await authClient.signIn.email({
      email: quickEmail,
      password: "Password123!",
    });
    console.log("[handleQuickLogin] result:", result);
    setIsSubmitting(false);
    if (result.error) {
      console.error("[handleQuickLogin] error:", result.error);
      setError(result.error.message || "Quick sign-in failed.");
      return;
    }
    const targetUrl = searchParams.get("redirect_url") || (quickEmail === "tembo@contour.app" ? "/agent" : "/dashboard");
    window.location.href = targetUrl;
  }

  async function handleGoogleSignIn() {
    setError(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: onboardingUrl,
    });

    if (result.error) {
      setError(result.error.message || "Google authentication is not configured.");
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-2 border border-editorial-black bg-white px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors"
      >
        <GoogleLogo />
        <span>Continue with Google</span>
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
          disabled={isSubmitting}
          className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-contour-red disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
