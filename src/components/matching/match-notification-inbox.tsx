"use client";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { SectionPendingState } from "@/components/ui/section-pending-state";
type Notice = { id: string; title: string; status: string; propertyId: string; property: { id: string; title: string } };
export function MatchNotificationInbox({ isOnline, revision, onOpen }: { isOnline: boolean; revision: number; onOpen: (id: string) => void }) {
  const { data: session } = authClient.useSession();
  const authenticated = Boolean(session);
  const [refreshRevision, setRefreshRevision] = useState(0);
  useEffect(() => { const refresh = () => setRefreshRevision((value) => value + 1); window.addEventListener("contour-matching-changed", refresh); return () => window.removeEventListener("contour-matching-changed", refresh); }, []);
  const scope = `${session?.session.activeOrganizationId || ""}:${session?.user.id || ""}`;
  const [loadedScope, setLoadedScope] = useState("");
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]), [count, setCount] = useState(0), [error, setError] = useState("");
  useEffect(() => {
    setNotices([]); setCount(0); setLoadedScope(scope);
    setLoading(false); setError("");
    if (!isOnline || !authenticated) return;
    const controller = new AbortController();
    setLoading(true);
    void fetch("/api/notifications/matches?pageSize=5", { cache: "no-store", signal: controller.signal }).then(async (res) => { const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error || "Unable to load match notifications"); if (controller.signal.aborted) return; setNotices(data.notifications); setCount(data.unreadCount); setError(""); }).catch((cause) => { if (!controller.signal.aborted) { setNotices([]); setCount(0); setError(cause.message); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [isOnline, revision, scope, authenticated, refreshRevision]);
  if (loadedScope !== scope) return null;
  if (!isOnline) return <p className="text-xs text-editorial-muted">Connect to refresh match notifications.</p>;
  if (loading) return <SectionPendingState compact label="Loading match notifications…" />;
  if (error) return <p role="alert" className="text-xs text-red-700">{error} <button type="button" onClick={() => setRefreshRevision(value => value + 1)} className="underline">Retry</button></p>;
  if (!notices.length) return null;
  return <section className="border bg-white p-3 space-y-2 text-editorial-black"><h2 className="font-semibold text-xs">Property matches · {count} unread</h2>{notices.map((notice) => <button key={notice.id} type="button" onClick={() => onOpen(notice.propertyId)} className="block text-left text-xs underline">{notice.title} · {notice.property.title}</button>)}</section>;
}
