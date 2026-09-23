export type FieldSyncStatus = "SAVING_LOCAL" | "QUEUED" | "SYNCING" | "SYNCED" | "FAILED";

const COPY: Record<FieldSyncStatus, { label: string; confirmed: boolean }> = {
  SAVING_LOCAL: { label: "Saving on this device…", confirmed: false },
  QUEUED: { label: "Saved offline — awaiting sync", confirmed: false },
  SYNCING: { label: "Syncing with Contour…", confirmed: false },
  SYNCED: { label: "Synced", confirmed: true },
  FAILED: { label: "Sync failed — retry required", confirmed: false },
};

export const fieldSyncCopy = (status: FieldSyncStatus) => COPY[status];
