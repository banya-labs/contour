"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("grace@contour.demo");
  const [password, setPassword] = useState("password123");

  const handleFastDevLogin = (role: string) => {
    if (role === "FIELD_AGENT") {
      router.push("/agent");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center p-6 text-ink-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-border shadow-card space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-contour-red text-white flex items-center justify-center font-serif font-bold text-2xl mx-auto shadow-subtle">
            C
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">
            Sign In to Contour
          </h1>
          <p className="text-xs text-ink-600">
            Enter your agency credentials to access the live operations hub.
          </p>
        </div>

        {/* Fast Dev Login Options */}
        <div className="bg-paper-200 p-4 rounded-xl border border-paper-300 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-contour-red">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast Dev Login (1-Click)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg bg-white hover:bg-paper-100 border border-border text-xs font-semibold text-ink-900 text-left transition-colors shadow-subtle flex items-center gap-1.5"
            >
              <span>👑</span>
              <span>Principal Broker</span>
            </Link>
            <Link
              href="/agent"
              className="px-3 py-2 rounded-lg bg-white hover:bg-paper-100 border border-border text-xs font-semibold text-ink-900 text-left transition-colors shadow-subtle flex items-center gap-1.5"
            >
              <span>📱</span>
              <span>Field Agent</span>
            </Link>
          </div>
        </div>

        {/* Standard Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard");
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-ink-800 mb-1">Email Address</label>
            <div className="flex items-center gap-2 bg-paper-100 px-3 py-2.5 rounded-xl border border-border">
              <Mail className="w-4 h-4 text-ink-600 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-ink-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-800 mb-1">Password</label>
            <div className="flex items-center gap-2 bg-paper-100 px-3 py-2.5 rounded-xl border border-border">
              <Lock className="w-4 h-4 text-ink-600 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-ink-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-ink-900 hover:bg-ink-950 text-white font-semibold transition-all shadow-subtle flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-ink-600 border-t border-border pt-4">
          Looking for marketing?{" "}
          <Link href="/" className="font-semibold text-contour-red hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
