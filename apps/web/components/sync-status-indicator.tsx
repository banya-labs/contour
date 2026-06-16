"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, WifiOff } from "lucide-react";

interface SyncStatus {
  status: "idle" | "syncing" | "success" | "error" | "offline";
  message?: string;
  lastSyncTime?: Date;
}

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: "idle",
    message: "Ready to sync",
  });

  useEffect(() => {
    // Listen for sync events from Electron (if running in desktop)
    if (typeof window !== "undefined" && "electron" in window) {
      const electron = (window as any).electron;

      electron.on("sync:start", () => {
        setSyncStatus({ status: "syncing", message: "Syncing..." });
      });

      electron.on("sync:progress", (message: string) => {
        setSyncStatus({ status: "syncing", message });
      });

      electron.on("sync:complete", (result: any) => {
        setSyncStatus({
          status: "success",
          message: `Synced: ${result.synced} items`,
          lastSyncTime: new Date(),
        });
      });

      electron.on("sync:error", (error: string) => {
        setSyncStatus({ status: "error", message: error });
      });

      electron.on("sync:offline", (offline: boolean) => {
        setSyncStatus({
          status: offline ? "offline" : "idle",
          message: offline ? "Offline mode - changes will sync when online" : "Online",
        });
      });
    }
  }, []);

  const getIcon = () => {
    switch (syncStatus.status) {
      case "syncing":
        return <Loader2 className="size-4 animate-spin" />;
      case "success":
        return <CheckCircle2 className="size-4 text-green-600" />;
      case "error":
        return <AlertCircle className="size-4 text-red-600" />;
      case "offline":
        return <WifiOff className="size-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (syncStatus.status) {
      case "syncing":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "offline":
        return "text-amber-600";
      default:
        return "text-gray-600";
    }
  };

  if (syncStatus.status === "idle") {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${getColor()}`}
    >
      {getIcon()}
      <span>{syncStatus.message}</span>
      {syncStatus.lastSyncTime && (
        <span className="ml-2 text-xs opacity-75">
          {syncStatus.lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
