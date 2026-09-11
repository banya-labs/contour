"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

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
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Local manual testing uses the demo tenant. Never enable this path in a
    // production bundle, even if the public flag is accidentally set there.
    if (isLocalDevelopment) {
      router.replace(redirectUrl);
      router.refresh();
      return;
    }

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

    router.replace(redirectUrl);
    router.refresh();
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
      {!isLocalDevelopment && (
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full border border-editorial-black bg-white px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors"
        >
          Continue with Google
        </button>
      )}

      {isLocalDevelopment && (
        <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Local demo mode is active. Submit the form to enter the demo workspace.
        </p>
      )}

      {!isLocalDevelopment && <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-editorial-muted">
        <span className="h-px flex-1 bg-editorial-border" />
        <span>or use email</span>
        <span className="h-px flex-1 bg-editorial-border" />
      </div>}

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
