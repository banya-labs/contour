"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { canRequestMatches, matchCacheKey } from "@/lib/matching/result-cache";
import type { MatchEnvelope } from "@/lib/matching/client-types";
export function usePropertyInquiryMatches(id: string, kind: "properties" | "inquiries" = "properties", view: "qualifying" | "near" = "qualifying", page = 1, isOnline = true) {
  const { data: session } = authClient.useSession();
  const organizationId = session?.session.activeOrganizationId, userId = session?.user.id;
  const key = organizationId && userId ? matchCacheKey({ organizationId, userId }, kind, id, view, page) : "";
  const [state, setState] = useState<{ key: string; data: MatchEnvelope | null; loading: boolean; error: string | null; stale: boolean }>({ key: "", data: null, loading: false, error: null, stale: false });
  const [revision, setRevision] = useState(0);
  const current = useRef(key); current.current = key;
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let cached: MatchEnvelope | null = null;
    try { cached = JSON.parse(localStorage.getItem(key) || "null"); } catch { /* An invalid cache is treated as absent. */ }
    if (!canRequestMatches(id)) { setState({ key, data: null, loading: false, error: "Matches will be available after this inquiry syncs.", stale: false }); return; }
    const online = isOnline && navigator.onLine;
    setState({ key, data: cached, loading: online, error: !online && !cached ? "Connect to check matches." : null, stale: Boolean(cached) });
    if (!online) return;
    void fetch(`/api/agent/matching/${kind}/${encodeURIComponent(id)}?view=${view}&page=${page}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const payload = await response.json();
      if ([403, 404].includes(response.status)) localStorage.removeItem(key);
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to check matches.");
      if (controller.signal.aborted || current.current !== key) return;
      try { localStorage.setItem(key, JSON.stringify(payload)); } catch { /* Cache quota must not hide successful results. */ }
      setState({ key, data: payload, loading: false, error: null, stale: false });
    }).catch((error: unknown) => {
      if (controller.signal.aborted || current.current !== key) return;
      // A denied scope must not keep previously cached contact data on screen.
      setState({ key, data: null, loading: false, error: error instanceof Error ? error.message : "Unable to check matches.", stale: false });
    });
    return () => controller.abort();
  }, [key, id, kind, view, page, isOnline, revision]);
  useEffect(() => { window.addEventListener("online", refresh); window.addEventListener("offline", refresh); return () => { window.removeEventListener("online", refresh); window.removeEventListener("offline", refresh); }; }, [refresh]);
  useEffect(() => { window.addEventListener("contour-matching-changed", refresh); return () => window.removeEventListener("contour-matching-changed", refresh); }, [refresh]);
  return { ...(state.key === key ? state : { data: null, loading: true, error: null, stale: false }), refresh };
}
