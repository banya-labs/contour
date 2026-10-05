"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { prepareStatement, statementUrl, type GenerationInput } from "@/lib/statements/document";
type Request = Omit<Extract<GenerationInput, { kind: "AGENT_COMMISSION" }>, "idempotencyKey"> | Omit<Extract<GenerationInput, { kind: "SALE" }>, "idempotencyKey"> | Omit<Extract<GenerationInput, { kind: "SALE_COMMISSION" }>, "idempotencyKey">;
export function StatementGenerateButton({ input, label = "Generate statement" }: { input: Request; label?: string }) {
  const [id, setId] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), version = useRef(0);
  const requestKey = useRef("");
  const signature = JSON.stringify(input);
  useEffect(() => { version.current++; requestKey.current = ""; setId(""); setError(""); setBusy(false); }, [signature]);
  const generate = async () => { if (busy) return; if (id || !requestKey.current) requestKey.current = crypto.randomUUID(); const attempt = ++version.current; setBusy(true); setError(""); setId(""); try { const saved = await prepareStatement({ ...input, idempotencyKey: requestKey.current }); if (attempt === version.current) setId(saved); } catch(e) { if (attempt === version.current) setError(e instanceof Error ? e.message : "Unable to generate statement."); } finally { if (attempt === version.current) setBusy(false); } };
  return <div className="space-y-2"><button type="button" disabled={busy} onClick={() => void generate()} className="min-h-11 w-full border border-editorial-black bg-editorial-black px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Preparing statement…" : label}</button>{error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{id && <div role="status"><Link href={statementUrl(id)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center bg-[#16382B] px-4 text-sm font-semibold text-white">Open statement viewer</Link></div>}</div>;
}
