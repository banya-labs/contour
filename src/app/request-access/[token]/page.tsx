"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function RequestAccessPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [organization, setOrganization] = useState<{ name: string } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { void fetch(`/api/access-requests/${token}`).then((r) => r.json()).then((data) => data.success ? setOrganization(data.organization) : setError(data.error)); }, [token]);
  useEffect(() => { if (session?.user) setEmail(session.user.email); }, [session]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setMessage(null); setSubmitting(true);
    if (!session) {
      const result = await authClient.signUp.email({ name: `${firstName.trim()} ${lastName.trim()}`, email: email.trim(), password, callbackURL: `/request-access/${token}` });
      if (result.error) { setError(result.error.message || "Unable to create your account."); setSubmitting(false); return; }
    }
    const response = await fetch(`/api/access-requests/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName }) });
    const data = await response.json().catch(() => null);
    setSubmitting(false);
    if (!response.ok) { setError(data?.error || "Unable to submit your request."); return; }
    setMessage("Request submitted. An administrator will review your access.");
  }

  if (sessionPending || !organization) return <main className="flex min-h-screen items-center justify-center bg-white px-6 text-sm text-editorial-muted">{error || "Checking access link..."}</main>;
  return <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12"><section className="w-full max-w-md border border-editorial-border bg-white p-8 shadow-sm"><p className="mb-3 text-[10px] font-heading font-bold uppercase tracking-[0.24em] text-contour-red">Contour workspace access</p><h1 className="font-display text-4xl text-editorial-black">Request access to {organization.name}</h1><p className="mt-3 text-sm leading-6 text-editorial-muted">Create your account, add your full name, and wait for an administrator to approve your request.</p>{message ? <div className="mt-8 space-y-4"><p className="border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">{message}</p><button onClick={() => router.push("/sign-in")} className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white">Go to sign in</button></div> : <form onSubmit={submit} className="mt-8 space-y-4"><div className="grid grid-cols-2 gap-3"><input required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border border-editorial-border px-3 py-3 text-sm" /><input required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border border-editorial-border px-3 py-3 text-sm" /></div><input required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={Boolean(session)} className="w-full border border-editorial-border px-3 py-3 text-sm disabled:bg-neutral-100" />{!session && <input required minLength={8} type="password" placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-editorial-border px-3 py-3 text-sm" />}{error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}<button disabled={submitting} className="w-full bg-editorial-black px-4 py-3 text-xs font-heading font-bold uppercase tracking-wider text-white disabled:opacity-50">{submitting ? "Submitting..." : session ? "Request workspace access" : "Create account and request access"}</button></form>}</section></main>;
}
