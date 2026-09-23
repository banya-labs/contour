"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Check } from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { SectionPendingState } from "@/components/ui/section-pending-state";

export default function DocumentAccessControlPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault/access");
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error("Failed to load access grants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleUpdate = async (userId: string, accessLevel: string, propertyIds: string[] = []) => {
    setSavingUserId(userId);
    try {
      const res = await fetch("/api/vault/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, accessLevel, propertyIds }),
      });
      if (res.ok) {
        setSavedUserId(userId);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === userId
              ? {
                  ...m,
                  vaultGrant: { ...m.vaultGrant, accessLevel, propertyIds },
                }
              : m
          )
        );
        setTimeout(() => setSavedUserId(null), 1500);
      }
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/documents"
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-serif text-stone-900 dark:text-stone-100">
            Vault Access Control Plane
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Enforce 3-tier user access control under the Zambia Data Protection Act No. 3 of 2021.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
          <SectionPendingState label="Loading vault access…" compact />
          <span>Loading organization access grants...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => {
            const grant = member.vaultGrant || { accessLevel: "ASSIGNED_ONLY", propertyIds: [] };
            const isSuper = member.role === "SUPER_ADMIN" || member.role === "BROKER_MANAGER";

            return (
              <div
                key={member.id}
                className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {member.name}
                      </h3>
                      {isSuper && (
                        <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {savingUserId === member.id && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <ContourSunLoader size="sm" label="Updating vault access…" decorative /> Updating vault access…
                      </span>
                    )}
                    {savedUserId === member.id && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" /> Updated
                      </span>
                    )}
                  </div>
                </div>

                {/* 3-Tier Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdate(member.id, "FULL_VAULT", [])}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      grant.accessLevel === "FULL_VAULT"
                        ? "bg-amber-50/80 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400"
                        : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                    }`}
                  >
                    <div className="text-xs font-semibold">Tier 1: Full Vault</div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      Access to all property folders & corporate compliance documents.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate(member.id, "ASSIGNED_ONLY", [])}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      grant.accessLevel === "ASSIGNED_ONLY"
                        ? "bg-amber-50/80 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400"
                        : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                    }`}
                  >
                    <div className="text-xs font-semibold">Tier 2: Assigned Properties Only</div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      Dynamically limited to listings assigned to this agent ({member.assignedProperties?.length || 0}).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate(member.id, "SPECIFIC_FOLDERS", grant.propertyIds || [])}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      grant.accessLevel === "SPECIFIC_FOLDERS"
                        ? "bg-amber-50/80 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400"
                        : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                    }`}
                  >
                    <div className="text-xs font-semibold">Tier 3: Specific Whitelist</div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      Custom folder whitelist for legal conveyancers or co-brokers.
                    </p>
                  </button>
                </div>

                {/* Whitelist selection if Tier 3 */}
                {grant.accessLevel === "SPECIFIC_FOLDERS" && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-lg border border-stone-200 dark:border-stone-700 space-y-2">
                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Select Permitted Properties:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {properties.map((p) => {
                        const isChecked = (grant.propertyIds || []).includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-700/50 text-xs cursor-pointer border border-stone-200 dark:border-stone-700/60"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const updated = isChecked
                                  ? (grant.propertyIds || []).filter((id: string) => id !== p.id)
                                  : [...(grant.propertyIds || []), p.id];
                                handleUpdate(member.id, "SPECIFIC_FOLDERS", updated);
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span className="truncate">{p.title}</span>
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
    </div>
  );
}
