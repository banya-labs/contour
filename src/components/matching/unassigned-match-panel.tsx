"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

type Match = { inquiry: { id: string; clientName: string; clientPhone: string; status: string }; property: { id: string; title: string; suburb: string; askingPrice: unknown; rentalPrice: unknown; currency: string }; score: number; reasons: string[] };

export function UnassignedMatchPanel({ compact = false }: { compact?: boolean }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const load = () => fetch("/api/matching/unassigned").then((r) => r.json()).then((d) => { if (d.success) setMatches(d.matches || []); }).catch(() => setError("Unable to load live matches."));
  useEffect(() => { void load(); }, []);
  const assign = async (match: Match) => {
    setBusy(match.inquiry.id); setError("");
    try {
      const response = await fetch(`/api/clients/${match.inquiry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: match.property.id }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Assignment failed.");
      setMatches((current) => current.filter((item) => item.inquiry.id !== match.inquiry.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Assignment failed."); } finally { setBusy(null); }
  };
  if (!matches.length && !error) return null;
  return <section className={`border-2 border-contour-red bg-[#fff5f3] ${compact ? "p-3" : "p-4 sm:p-5"}`}>
    <div className="flex items-start gap-3"><Sparkles className="w-5 h-5 text-contour-red shrink-0" /><div><p className="text-[10px] font-mono font-bold uppercase tracking-widest text-contour-red">Live property matches</p><h2 className="font-heading font-bold text-base text-editorial-black">{matches.length} unassigned client {matches.length === 1 ? "can move" : "matches can move"} forward</h2><p className="text-xs text-editorial-muted mt-1">Assign the best listing and move the inquiry to Contacted in one action.</p></div></div>
    <div className="mt-3 space-y-2">{matches.map((match) => <div key={match.inquiry.id} className="bg-white border border-contour-red/20 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div className="min-w-0"><p className="font-heading font-bold text-xs truncate">{match.inquiry.clientName} <span className="text-contour-red">· {match.score}% fit</span></p><p className="text-[11px] text-editorial-muted truncate">{match.property.title} · {match.property.suburb} · {match.reasons.join(", ") || "criteria match"}</p></div><button type="button" disabled={busy === match.inquiry.id} onClick={() => void assign(match)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-editorial-black hover:bg-contour-red disabled:opacity-50 text-white text-[10px] font-heading font-bold uppercase tracking-wider shrink-0">{busy === match.inquiry.id ? "Assigning..." : "Assign & Contact"}<ArrowRight className="w-3.5 h-3.5" /></button></div>)}</div>
    {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
  </section>;
}
