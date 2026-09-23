"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldAlert, Check } from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";

interface VaultAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  properties: Array<{ id: string; title: string; suburb: string }>;
}

export function VaultAccessModal({
  isOpen,
  onClose,
  onSuccess,
  properties,
}: VaultAccessModalProps) {
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingUserId, setSavingUserId] = React.useState<string | null>(null);
  const [successUserId, setSuccessUserId] = React.useState<string | null>(null);

  const fetchAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault/access");
      const data = await res.json();
      if (res.ok && data.members) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error("Failed to load vault access grants:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchAccess();
    }
  }, [isOpen]);

  const handleUpdateGrant = async (
    userId: string,
    accessLevel: "FULL_VAULT" | "ASSIGNED_ONLY" | "SPECIFIC_FOLDERS",
    propertyIds: string[] = []
  ) => {
    setSavingUserId(userId);
    try {
      const res = await fetch("/api/vault/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accessLevel,
          propertyIds,
        }),
      });

      if (res.ok) {
        setSuccessUserId(userId);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === userId
              ? {
                  ...m,
                  vaultGrant: {
                    ...m.vaultGrant,
                    accessLevel,
                    propertyIds,
                  },
                }
              : m
          )
        );
        setTimeout(() => setSuccessUserId(null), 1500);
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to save grant:", err);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto bg-white border-editorial-border text-editorial-black rounded-none shadow-2xl p-6">
        <DialogHeader className="border-b border-editorial-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-heading font-bold uppercase tracking-wider text-editorial-black">
            <ShieldAlert className="w-4 h-4 text-contour-red" />
            3-Tier Vault Access Control (RBAC)
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-editorial-muted">
            Enforce strict tenant data boundaries. Control which agents and external legal conveyancers can view title deeds and identity documents.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-xs font-mono text-editorial-muted">
            <ContourSunLoader size="sm" label="Loading vault access…" decorative />
            <span className="uppercase tracking-wider">Loading tenant permissions...</span>
          </div>
        ) : (
          <div className="space-y-4 pt-3">
            {members.map((member) => {
              const grant = member.vaultGrant || {
                accessLevel: "ASSIGNED_ONLY",
                propertyIds: [],
              };
              const isSuperAdmin = member.role === "SUPER_ADMIN" || member.role === "BROKER_MANAGER";

              return (
                <div
                  key={member.id}
                  className="p-3.5 rounded-none border border-editorial-border bg-white space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 text-editorial-black">
                        <span>{member.name}</span>
                        {isSuperAdmin && (
                          <span className="text-[9px] font-mono bg-editorial-black text-white px-1.5 py-0.5 rounded-none uppercase">
                            Super Admin
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-mono text-editorial-muted">{member.email}</p>
                    </div>

                    {savingUserId === member.id ? (
                      <ContourSunLoader size="sm" label="Updating vault access…" decorative />
                    ) : successUserId === member.id ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-emerald-600 font-bold uppercase">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    ) : null}
                  </div>

                  {/* 3-Tier Radio Selector */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => handleUpdateGrant(member.id, "FULL_VAULT", [])}
                      className={`p-2.5 rounded-none border text-left transition-colors ${
                        grant.accessLevel === "FULL_VAULT"
                          ? "bg-[#fff5f3] border-contour-red text-editorial-black font-semibold"
                          : "border-editorial-border bg-white hover:bg-editorial-bg text-editorial-muted"
                      }`}
                    >
                      <div className="font-bold uppercase tracking-wider mb-0.5 text-[11px] text-editorial-black">
                        Full Vault
                      </div>
                      <div className="text-[10px] text-editorial-muted leading-snug">All properties & corporate compliance</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateGrant(member.id, "ASSIGNED_ONLY", [])}
                      className={`p-2.5 rounded-none border text-left transition-colors ${
                        grant.accessLevel === "ASSIGNED_ONLY"
                          ? "bg-[#fff5f3] border-contour-red text-editorial-black font-semibold"
                          : "border-editorial-border bg-white hover:bg-editorial-bg text-editorial-muted"
                      }`}
                    >
                      <div className="font-bold uppercase tracking-wider mb-0.5 text-[11px] text-editorial-black">
                        Assigned Only
                      </div>
                      <div className="text-[10px] text-editorial-muted leading-snug">
                        Only assigned ({member.assignedProperties?.length || 0})
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateGrant(member.id, "SPECIFIC_FOLDERS", grant.propertyIds || [])}
                      className={`p-2.5 rounded-none border text-left transition-colors ${
                        grant.accessLevel === "SPECIFIC_FOLDERS"
                          ? "bg-[#fff5f3] border-contour-red text-editorial-black font-semibold"
                          : "border-editorial-border bg-white hover:bg-editorial-bg text-editorial-muted"
                      }`}
                    >
                      <div className="font-bold uppercase tracking-wider mb-0.5 text-[11px] text-editorial-black">
                        Specific Folders
                      </div>
                      <div className="text-[10px] text-editorial-muted leading-snug">Custom folder whitelist</div>
                    </button>
                  </div>

                  {/* If SPECIFIC_FOLDERS selected, show property picker */}
                  {grant.accessLevel === "SPECIFIC_FOLDERS" && (
                    <div className="pt-2 border-t border-editorial-border">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-editorial-muted mb-1.5">
                        Allowed Property Vault Folders:
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {properties.map((p) => {
                          const isChecked = (grant.propertyIds || []).includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 p-1.5 rounded-none hover:bg-editorial-bg text-xs font-mono cursor-pointer border border-transparent hover:border-editorial-border"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const updated = isChecked
                                    ? (grant.propertyIds || []).filter((id: string) => id !== p.id)
                                    : [...(grant.propertyIds || []), p.id];
                                  handleUpdateGrant(member.id, "SPECIFIC_FOLDERS", updated);
                                }}
                                className="rounded-none text-contour-red accent-[#fa3600]"
                              />
                              <span className="truncate text-editorial-black">{p.title} ({p.suburb})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-editorial-border mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-editorial-black text-white hover:bg-neutral-800 rounded-none transition-colors"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
