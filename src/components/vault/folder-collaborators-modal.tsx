"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Lock,
} from "lucide-react";

export interface VaultMember {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  vaultGrant?: {
    accessLevel: string;
    propertyIds: string[];
    canVerifyDocs?: boolean;
    canDeleteDocs?: boolean;
  } | null;
}

interface FolderCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    suburb: string;
    status: string;
    titleDeedNumber?: string | null;
    assignedAgentId?: string | null;
    assignedAgent?: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
  } | null;
  members: VaultMember[];
  onUpdateSuccess?: () => void;
  onAccessUpdated?: () => void;
}

export function FolderCollaboratorsModal({
  isOpen,
  onClose,
  property,
  members,
  onUpdateSuccess,
  onAccessUpdated,
}: FolderCollaboratorsModalProps) {
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  if (!property) return null;

  // 1. Identify Inherited Admins
  const orgAdmins = members.filter(
    (m) =>
      m.role === "SUPER_ADMIN" ||
      m.role === "BROKER_MANAGER" ||
      m.vaultGrant?.accessLevel === "FULL_VAULT"
  );

  // 2. Identify Assigned Agent
  const assignedAgent = members.find((m) => m.id === property.assignedAgentId);

  // 3. Identify Direct Folder Collaborators
  const directCollaborators = members.filter((m) => {
    // Exclude if already an org admin or assigned agent
    if (orgAdmins.some((a) => a.id === m.id)) return false;
    if (assignedAgent && assignedAgent.id === m.id) return false;
    // Check if property ID is in their whitelisted folders
    return m.vaultGrant?.propertyIds?.includes(property.id);
  });

  // 4. Identify Available Members to Add
  const availableToAdd = members.filter((m) => {
    if (orgAdmins.some((a) => a.id === m.id)) return false;
    if (assignedAgent && assignedAgent.id === m.id) return false;
    if (directCollaborators.some((c) => c.id === m.id)) return false;
    return true;
  });

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const targetMember = members.find((m) => m.id === selectedUserId);
    if (!targetMember) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const existingProps = targetMember.vaultGrant?.propertyIds || [];
    const updatedProps = Array.from(new Set([...existingProps, property.id]));

    try {
      const res = await fetch("/api/vault/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetMember.id,
          accessLevel: "SPECIFIC_FOLDERS",
          propertyIds: updatedProps,
          canVerifyDocs: targetMember.vaultGrant?.canVerifyDocs ?? false,
          canDeleteDocs: targetMember.vaultGrant?.canDeleteDocs ?? false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grant folder access");
      }

      setSuccessMsg(`Granted folder access to ${targetMember.name}.`);
      setSelectedUserId("");
      onUpdateSuccess?.();
      onAccessUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (memberId: string) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    if (!confirm(`Revoke ${targetMember.name}'s access to this folder?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const existingProps = targetMember.vaultGrant?.propertyIds || [];
    const updatedProps = existingProps.filter((id) => id !== property.id);
    const newAccessLevel = updatedProps.length > 0 ? "SPECIFIC_FOLDERS" : "ASSIGNED_ONLY";

    try {
      const res = await fetch("/api/vault/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetMember.id,
          accessLevel: newAccessLevel,
          propertyIds: updatedProps,
          canVerifyDocs: targetMember.vaultGrant?.canVerifyDocs ?? false,
          canDeleteDocs: targetMember.vaultGrant?.canDeleteDocs ?? false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove folder access");
      }

      setSuccessMsg(`Revoked ${targetMember.name}'s direct access to this folder.`);
      onUpdateSuccess?.();
      onAccessUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-neutral-100 text-editorial-black border border-editorial-border px-1.5 py-0.2 rounded-none">
              Folder Access Control
            </span>
            <span className="text-[10px] font-mono text-editorial-muted">
              {property.suburb}
            </span>
          </div>
          <DialogTitle className="text-sm font-heading font-bold uppercase tracking-wider text-editorial-black mt-1">
            {property.title}
          </DialogTitle>
          <DialogDescription className="text-xs font-geist text-editorial-muted">
            Inspect all agents and collaborators permitted to view and manage files in this property vault.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-[#fff5f3] border border-contour-red/30 text-xs text-contour-red rounded-none font-geist">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded-none font-geist">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-5 font-geist">
          {/* 1. Add Collaborator Form */}
          <form onSubmit={handleAddCollaborator} className="p-3 bg-neutral-50 border border-editorial-border space-y-2.5 rounded-none">
            <div className="flex items-center gap-1.5 text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black">
              <UserPlus className="w-3.5 h-3.5 text-contour-red" />
              <span>Add Folder Collaborator</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isSubmitting || availableToAdd.length === 0}
                className="flex-1 text-xs rounded-none border border-editorial-border bg-white px-2.5 py-1.5 text-editorial-black focus:border-editorial-black outline-none"
              >
                <option value="">
                  {availableToAdd.length === 0
                    ? "All team members already have access"
                    : "-- Select team member to add --"}
                </option>
                {availableToAdd.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.replace("_", " ")}) — {m.email}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!selectedUserId || isSubmitting}
                className="px-4 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider bg-editorial-black hover:bg-contour-red text-white disabled:opacity-50 transition-colors rounded-none flex items-center justify-center gap-1.5 shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>Grant Access</span>
              </button>
            </div>
          </form>

          {/* 2. Direct Folder Collaborators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-editorial-border">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-contour-red" />
                Direct Collaborators ({directCollaborators.length})
              </span>
              <span className="text-[10px] font-mono text-editorial-muted">
                Whitelisted specifically for this property
              </span>
            </div>

            {directCollaborators.length === 0 ? (
              <div className="p-3 bg-white border border-editorial-border text-center text-xs text-editorial-muted italic">
                No direct guest collaborators assigned to this folder yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {directCollaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-editorial-border hover:bg-[#fff5f3] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-editorial-black text-white font-mono text-xs flex items-center justify-center rounded-none font-bold shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-editorial-black truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] font-mono text-editorial-muted truncate">
                          {c.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono uppercase bg-neutral-100 text-editorial-black border border-editorial-border px-1.5 py-0.2">
                        Direct Grant
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(c.id)}
                        disabled={isSubmitting}
                        title="Revoke access"
                        className="p-1 hover:bg-red-50 text-editorial-muted hover:text-contour-red border border-transparent hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Assigned Listing Agent */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-editorial-border">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-editorial-black" />
                Assigned Listing Agent
              </span>
              <span className="text-[10px] font-mono text-editorial-muted">
                Inherits full property permissions
              </span>
            </div>

            {assignedAgent ? (
              <div className="flex items-center justify-between p-2.5 bg-white border border-editorial-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-editorial-black text-white font-mono text-xs flex items-center justify-center rounded-none font-bold shrink-0">
                    {assignedAgent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-editorial-black truncate">
                      {assignedAgent.name}
                    </div>
                    <div className="text-[10px] font-mono text-editorial-muted truncate">
                      {assignedAgent.email}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase bg-neutral-100 text-editorial-black border border-editorial-border px-1.5 py-0.2">
                  Assigned Agent
                </span>
              </div>
            ) : (
              <div className="p-3 bg-white border border-editorial-border text-center text-xs text-editorial-muted italic">
                No specific listing agent assigned. Managed by brokerage admin team.
              </div>
            )}
          </div>

          {/* 4. Inherited Agency Administrators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-editorial-border">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-editorial-muted" />
                Brokerage Principals & Admins ({orgAdmins.length})
              </span>
              <span className="text-[10px] font-mono text-editorial-muted">
                Statutory full vault access
              </span>
            </div>

            <div className="space-y-1.5">
              {orgAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-2 bg-neutral-50/50 border border-editorial-border"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 bg-neutral-200 text-editorial-black font-mono text-[10px] flex items-center justify-center rounded-none font-bold shrink-0">
                      {admin.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-editorial-black truncate">
                        {admin.name}
                      </div>
                      <div className="text-[10px] font-mono text-editorial-muted truncate">
                        {admin.email}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase bg-white text-editorial-muted border border-editorial-border px-1.5 py-0.2">
                    {admin.role.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FolderCollaboratorsModal;
