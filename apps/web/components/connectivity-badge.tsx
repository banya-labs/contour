"use client";

import { useEffect, useMemo, useState } from "react";

type ConnectivityBadgeProps = {
  lastSyncAt: string | null;
};

function formatLastSync(lastSyncAt: string | null) {
  if (!lastSyncAt) {
    return "No sync yet";
  }

  const timestamp = new Date(lastSyncAt);
  const deltaMs = Date.now() - timestamp.getTime();
  const deltaMinutes = Math.max(0, Math.round(deltaMs / 60000));

  if (deltaMinutes < 1) {
    return "Synced just now";
  }

  if (deltaMinutes < 60) {
    return `Synced ${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `Synced ${deltaHours}h ago`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  return `Synced ${deltaDays}d ago`;
}

export function ConnectivityBadge({ lastSyncAt }: ConnectivityBadgeProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const statusLabel = useMemo(() => {
    return isOnline ? "Online" : "Offline";
  }, [isOnline]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[12px] text-[color:var(--muted)]">
      <span
        className={`size-2 rounded-full ${
          isOnline ? "bg-[color:var(--success)]" : "bg-[color:var(--muted)]"
        }`}
      />
      <span className="font-medium text-[color:var(--foreground)]">{statusLabel}</span>
      <span>·</span>
      <span>{formatLastSync(lastSyncAt)}</span>
    </div>
  );
}
