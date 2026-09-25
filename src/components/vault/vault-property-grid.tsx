"use client";

import * as React from "react";
import {
  Folder,
  FileText,
  ShieldCheck,
  Plus,
  Users,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import { VaultDoc, PropertyItem } from "./vault-tree";
import { VaultMember } from "./folder-collaborators-modal";

interface VaultPropertyGridProps {
  properties: PropertyItem[];
  documents: VaultDoc[];
  members: VaultMember[];
  onOpenUpload: (propertyId?: string) => void;
  onOpenCollaborators: (property: PropertyItem) => void;
  onSwitchToTree?: (propertyId: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export function VaultPropertyGrid({
  properties,
  documents,
  members,
  onOpenUpload,
  onOpenCollaborators,
  onSwitchToTree,
  onRefresh,
}: VaultPropertyGridProps) {
  // Pre-calculate documents map by property
  const docsByProperty = React.useMemo(() => {
    const map = new Map<string, VaultDoc[]>();
    documents.forEach((d) => {
      if (d.propertyId) {
        const list = map.get(d.propertyId) || [];
        list.push(d);
        map.set(d.propertyId, list);
      }
    });
    return map;
  }, [documents]);

  if (properties.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-editorial-border bg-neutral-50 rounded-none font-geist">
        <Building className="w-8 h-8 text-editorial-muted mx-auto mb-2" />
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
          No Property Vaults Found
        </h3>
        <p className="text-xs text-editorial-muted mt-1 max-w-sm mx-auto">
          No properties match your current search and filter criteria. Clear filters or add a new property.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 font-geist">
      {properties.map((property) => {
        const propDocs = docsByProperty.get(property.id) || [];
        const isArchived = property.status === "ARCHIVED";
        const verifiedCount = propDocs.filter((d) => d.isVerified).length;

        // Categorized counts
        const hasTitle = propDocs.some((d) => d.docType === "TITLE_DEED");
        const hasLease = propDocs.some((d) => d.docType === "LEASE_CONTRACT");
        const hasKyc = propDocs.some((d) => d.docType === "NRC_PASSPORT_ID");
        const hasMandate = propDocs.some((d) => d.docType === "MANDATE_AGREEMENT");

        // Calculate collaborators for this property
        const orgAdmins = members.filter(
          (m) =>
            m.role === "SUPER_ADMIN" ||
            m.role === "BROKER_MANAGER" ||
            m.vaultGrant?.accessLevel === "FULL_VAULT"
        );
        const assignedAgent = members.find((m) => m.id === property.assignedAgentId);
        const directCollaborators = members.filter(
          (m) =>
            !orgAdmins.some((a) => a.id === m.id) &&
            (!assignedAgent || assignedAgent.id !== m.id) &&
            m.vaultGrant?.propertyIds?.includes(property.id)
        );

        const allCollaborators = [
          ...orgAdmins.slice(0, 2),
          ...(assignedAgent ? [assignedAgent] : []),
          ...directCollaborators,
        ];
        // Deduplicate
        const uniqueCollaborators = Array.from(
          new Map(allCollaborators.map((m) => [m.id, m])).values()
        );

        return (
          <div
            key={property.id}
            className={`group bg-white border border-editorial-border hover:border-editorial-black transition-all rounded-none flex flex-col justify-between ${
              isArchived ? "opacity-80 bg-neutral-50/50" : ""
            }`}
          >
            {/* 1. Header Metadata Bar */}
            <div className="p-4 pb-3 border-b border-editorial-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase bg-neutral-100 text-editorial-black border border-editorial-border px-1.5 py-0.2 rounded-none">
                  {property.titleDeedNumber || `Stand #${property.id.slice(0, 6)}`}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-editorial-muted">
                    {property.suburb}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-none border ${
                      property.status === "AVAILABLE"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : property.status === "UNDER_OFFER"
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : isArchived
                        ? "border-neutral-300 bg-neutral-100 text-editorial-muted"
                        : "border-editorial-border bg-neutral-50 text-editorial-black"
                    }`}
                  >
                    {property.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Property Title */}
              <h3
                onClick={() => onSwitchToTree?.(property.id)}
                className="font-heading text-sm font-bold text-editorial-black uppercase tracking-wider hover:text-contour-red cursor-pointer transition-colors line-clamp-1"
                title={property.title}
              >
                {property.title}
              </h3>
              {(property.matchingInquiries?.length || 0) > 0 && (
                <div className="mt-2 border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide text-emerald-800">
                  {property.matchingInquiries?.length} matching {property.listingType === "FOR_RENT" ? "renter" : "buyer"}{(property.matchingInquiries?.length || 0) === 1 ? "" : "s"}
                </div>
              )}
            </div>

            {/* 2. Document Metrics & Category Checklist */}
            <div className="p-4 space-y-3 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-editorial-muted flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-editorial-muted" />
                  Files in Vault:
                </span>
                <span className="font-mono font-semibold text-editorial-black">
                  {propDocs.length} {propDocs.length === 1 ? "file" : "files"}
                </span>
              </div>

              {/* Progress / Verification pill */}
              <div className="flex items-center justify-between text-xs p-2 bg-neutral-50 border border-editorial-border">
                <span className="text-[11px] text-editorial-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Status:
                </span>
                <span className="font-mono text-xs font-bold text-editorial-black">
                  {verifiedCount} / {propDocs.length || 0}
                </span>
              </div>

              {/* Essential Categories Pills */}
              <div className="space-y-1">
                <span className="text-[10px] font-heading uppercase tracking-wider text-editorial-muted block">
                  Mandatory Documents
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <span
                    className={`px-1.5 py-0.5 border flex items-center gap-1 ${
                      hasTitle
                        ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 font-semibold"
                        : "border-neutral-200 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    {hasTitle ? "✓" : "○"} Title Deed
                  </span>
                  <span
                    className={`px-1.5 py-0.5 border flex items-center gap-1 ${
                      hasMandate
                        ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 font-semibold"
                        : "border-neutral-200 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    {hasMandate ? "✓" : "○"} Mandate
                  </span>
                  <span
                    className={`px-1.5 py-0.5 border flex items-center gap-1 ${
                      hasLease
                        ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 font-semibold"
                        : "border-neutral-200 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    {hasLease ? "✓" : "○"} Lease Contract
                  </span>
                  <span
                    className={`px-1.5 py-0.5 border flex items-center gap-1 ${
                      hasKyc
                        ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 font-semibold"
                        : "border-neutral-200 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    {hasKyc ? "✓" : "○"} NRC / KYC
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Collaborators & Action Footer */}
            <div className="p-3 border-t border-editorial-border bg-neutral-50/50 space-y-2.5">
              {/* Collaborator Avatars */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {uniqueCollaborators.slice(0, 4).map((c) => (
                      <div
                        key={c.id}
                        title={`${c.name} (${c.role.replace("_", " ")})`}
                        className="inline-block h-5 w-5 bg-editorial-black text-white font-mono text-[9px] font-bold flex items-center justify-center border border-white rounded-none"
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                  </div>

                  {uniqueCollaborators.length > 4 && (
                    <span className="text-[10px] font-mono text-editorial-muted ml-1">
                      +{uniqueCollaborators.length - 4}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenCollaborators(property)}
                  className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-black hover:text-contour-red flex items-center gap-1 underline"
                >
                  <Users className="w-3 h-3" />
                  <span>Manage Access</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSwitchToTree?.(property.id)}
                  className="px-2.5 py-1.5 text-[11px] font-heading font-semibold uppercase tracking-wider bg-white hover:bg-neutral-100 text-editorial-black border border-editorial-border hover:border-editorial-black transition-colors rounded-none flex items-center justify-center gap-1"
                >
                  <span>Open Folder</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenUpload(property.id)}
                  disabled={isArchived}
                  className="px-2.5 py-1.5 text-[11px] font-heading font-semibold uppercase tracking-wider bg-editorial-black hover:bg-contour-red text-white transition-colors rounded-none flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VaultPropertyGrid;
