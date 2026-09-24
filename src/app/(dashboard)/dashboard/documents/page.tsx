"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  ShieldCheck,
  Search,
  Upload,
  Link2,
  Users,
  Lock,
  Building,
  RefreshCw,
  Scale,
  Info,
  LayoutGrid,
  FolderTree,
  Filter,
} from "lucide-react";
import { VaultTree, VaultDoc, PropertyItem } from "@/components/vault/vault-tree";
import { VaultPropertyGrid } from "@/components/vault/vault-property-grid";
import { UploadDocumentModal } from "@/components/vault/upload-document-modal";
import { RequestDocumentModal } from "@/components/vault/request-document-modal";
import { VaultAccessModal } from "@/components/vault/vault-access-modal";
import { FolderCollaboratorsModal } from "@/components/vault/folder-collaborators-modal";
import { DocumentDetailsModal } from "@/components/vault/document-details-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { UnassignedMatchPanel } from "@/components/matching/unassigned-match-panel";
import { mutationTouchesScope, WORKSPACE_MUTATION_EVENT, type WorkspaceMutationEventDetail } from "@/lib/workspace-events";

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<VaultDoc[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [accessLevel, setAccessLevel] = useState<string>("FULL_VAULT");
  const [loading, setLoading] = useState(true);

  // View Mode: Tree vs Grid
  const [viewMode, setViewMode] = useState<"TREE" | "GRID">("TREE");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPropertyId, setUploadPropertyId] = useState<string | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isDpaModalOpen, setIsDpaModalOpen] = useState(false);

  // Collaborator Modal
  const [isCollabsOpen, setIsCollabsOpen] = useState(false);
  const [selectedPropertyForCollabs, setSelectedPropertyForCollabs] = useState<PropertyItem | null>(null);

  // Document Details & Preview Modal
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<VaultDoc | null>(null);

  const loadVaultData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault/documents");
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments(data.documents || []);
        setProperties(data.properties || []);
        setMembers(data.members || []);
        if (data.accessLevel) {
          setAccessLevel(data.accessLevel);
        }
      }
    } catch (err) {
      console.error("Failed to load vault:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, [refreshNonce]);
  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceMutationEventDetail>).detail;
      if (detail && mutationTouchesScope(detail, "documents")) setRefreshNonce((value) => value + 1);
    };
    window.addEventListener(WORKSPACE_MUTATION_EVENT, handle);
    return () => window.removeEventListener(WORKSPACE_MUTATION_EVENT, handle);
  }, []);

  const totalFiles = documents.length;
  const verifiedCount = documents.filter((d) => d.isVerified).length;
  const totalSizeBytes = documents.reduce((acc, d) => acc + (d.fileSize || 0), 0);
  const totalSizeMb = (totalSizeBytes / 1024 / 1024).toFixed(2);
  const clientUploadsCount = documents.filter((d) => d.uploadedByType === "CLIENT").length;

  const handleOpenUploadForProperty = (propId?: string) => {
    setUploadPropertyId(propId || null);
    setIsUploadOpen(true);
  };

  const handleOpenCollaborators = (property: PropertyItem) => {
    setSelectedPropertyForCollabs(property);
    setIsCollabsOpen(true);
  };

  // Filtered properties based on Search, Status, and Category
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // 1. Property Status filter
      if (statusFilter !== "ALL" && prop.status !== statusFilter) {
        return false;
      }

      // 2. Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = prop.title.toLowerCase().includes(q);
        const suburbMatch = prop.suburb.toLowerCase().includes(q);
        const standMatch = prop.standPlotNumber?.toLowerCase().includes(q) || false;
        const folioMatch = prop.titleDeedNumber?.toLowerCase().includes(q) || false;
        const docMatch = documents.some(
          (d) => d.propertyId === prop.id && d.title.toLowerCase().includes(q)
        );
        if (!titleMatch && !suburbMatch && !standMatch && !folioMatch && !docMatch) {
          return false;
        }
      }

      // 3. Category filter (must have at least one doc of that category)
      if (category !== "ALL") {
        const hasCategoryDoc = documents.some(
          (d) => d.propertyId === prop.id && d.docType === category
        );
        if (!hasCategoryDoc) return false;
      }

      return true;
    });
  }, [properties, documents, search, statusFilter, category]);

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32 space-y-6 font-geist antialiased text-editorial-black">
      {/* Top Banner: Zambia DPA Compliance Notice */}
      <div className="border-t-2 border-contour-red border-x border-b border-editorial-border bg-white text-editorial-black p-4 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-editorial-bg border border-editorial-border flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-contour-red" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-contour-red">
                Zambia Data Protection Act No. 3 of 2021
              </span>
              <span className="text-[10px] font-mono bg-editorial-bg text-editorial-black px-1.5 py-0.5 border border-editorial-border uppercase">
                ODPC Reg. Statutory Custody
              </span>
            </div>
            <p className="text-xs text-editorial-muted mt-0.5 leading-relaxed">
              Encrypted document vault with 15-min presigned tokens, immutable audit logs, and automatic 7-year statutory retention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsDpaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-white hover:bg-[#fff5f3] hover:border-contour-red/40 text-editorial-black rounded-none border border-editorial-border transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-contour-red" />
            <span>Compliance Policy</span>
          </button>
        </div>
      </div>

      {/* Main Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-editorial-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 bg-contour-red" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-editorial-muted">
              Legal Records & Title Deeds
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold uppercase tracking-wider text-editorial-black">
            Legal & Document Vault
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-2xl">
            Custodial repository for Certificates of Title, NRC ID scans, Sole Mandates, and client ingestions with granular collaborator controls.
          </p>
      </div>

      <UnassignedMatchPanel compact />

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenUploadForProperty(undefined)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-contour-red hover:bg-contour-red/90 text-white rounded-none shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRequestOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase tracking-wider bg-white hover:bg-[#fff5f3] text-editorial-black rounded-none border border-editorial-border transition-colors"
          >
            <Link2 className="w-3.5 h-3.5 text-contour-red" />
            <span>Request Client Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAccessOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase tracking-wider bg-white hover:bg-editorial-bg text-editorial-black rounded-none border border-editorial-border transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-editorial-muted" />
            <span>Access Control</span>
          </button>

          <button
            type="button"
            onClick={loadVaultData}
            title="Refresh Vault Data"
            className="p-2 text-editorial-muted hover:text-editorial-black hover:bg-[#fff5f3] rounded-none border border-editorial-border transition-colors"
          >
            {loading ? <ContourSunLoader size="sm" label="Refreshing vault…" decorative /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-none border border-editorial-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Documents</span>
            <FileText className="w-4 h-4 text-editorial-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-editorial-black">{totalFiles}</div>
          <p className="text-[11px] font-mono text-editorial-muted mt-1">{totalSizeMb} MB S3 storage</p>
        </div>

        <div className="p-4 bg-white rounded-none border border-editorial-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider">Verified Folios</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{verifiedCount}</div>
          <p className="text-[11px] font-mono text-editorial-muted mt-1">Confirmed Lands Registry</p>
        </div>

        <div className="p-4 bg-white rounded-none border border-editorial-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider">Client Ingests</span>
            <Link2 className="w-4 h-4 text-contour-red" />
          </div>
          <div className="text-2xl font-bold font-mono text-editorial-black">{clientUploadsCount}</div>
          <p className="text-[11px] font-mono text-editorial-muted mt-1">Via PIN-protected links</p>
        </div>

        <div className="p-4 bg-white rounded-none border border-editorial-border shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider">Your Access Tier</span>
            <Lock className="w-4 h-4 text-contour-red" />
          </div>
          <div className="text-sm font-bold font-mono text-contour-red truncate uppercase mt-1">
            {accessLevel.replace("_", " ")}
          </div>
          <p className="text-[11px] font-mono text-editorial-muted mt-1">3-Tier RBAC Scoped</p>
        </div>
      </div>

      {/* Search, Filter & View Switcher Toolbar */}
      <div className="bg-white rounded-none border border-editorial-border p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Property / File */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-editorial-muted" />
          <input
            type="text"
            placeholder="Search properties, folios, stand #, title deeds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs font-mono rounded-none border border-editorial-border bg-white text-editorial-black placeholder-editorial-muted focus:outline-none focus:border-contour-red"
          />
        </div>

        {/* Filters and View Mode Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-editorial-muted hidden sm:inline" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-none border border-editorial-border bg-white text-editorial-black focus:outline-none focus:border-contour-red"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">🟢 Available</option>
              <option value="UNDER_OFFER">🟡 Under Offer</option>
              <option value="SOLD">🔵 Sold</option>
              <option value="RENTED">🟣 Rented</option>
              <option value="ARCHIVED">🔒 Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs font-mono px-2.5 py-1.5 rounded-none border border-editorial-border bg-white text-editorial-black focus:outline-none focus:border-contour-red"
          >
            <option value="ALL">All Categories</option>
            <option value="TITLE_DEED">📜 Title Deeds & Diagrams</option>
            <option value="NRC_PASSPORT_ID">🪪 NRC / Passports</option>
            <option value="MANDATE_AGREEMENT">📝 Mandate Agreements</option>
            <option value="LEASE_CONTRACT">🏠 Leases & Tenancy</option>
            <option value="PROOF_OF_RESIDENCE">📬 Proof of Residence</option>
            <option value="VALUATION_REPORT">📊 Valuation Reports</option>
          </select>

          {/* View Mode Switcher: Tree vs Grid */}
          <div className="flex items-center border border-editorial-border rounded-none overflow-hidden ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setViewMode("TREE")}
              title="Hierarchical Folder Tree View"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                viewMode === "TREE"
                  ? "bg-editorial-black text-white"
                  : "bg-white text-editorial-muted hover:text-editorial-black hover:bg-editorial-bg"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tree View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              title="Architectural Property Grid View"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border-l border-editorial-border transition-colors ${
                viewMode === "GRID"
                  ? "bg-editorial-black text-white"
                  : "bg-white text-editorial-muted hover:text-editorial-black hover:bg-editorial-bg"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Tree or Grid */}
      <div className="bg-white rounded-none border border-editorial-border p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[460px]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-editorial-border">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-contour-red" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black">
              {viewMode === "TREE" ? "Contour Vault Directory Tree" : "Contour Property Vaults Grid"}
            </span>
          </div>
          <span className="text-xs font-mono text-editorial-muted">
            Showing {filteredProperties.length} of {properties.length} Properties · {totalFiles} Documents
          </span>
        </div>

        {loading ? (
          <SectionPendingState label="Loading document vault…" description="Decrypting and assembling the vault hierarchy." />
        ) : viewMode === "GRID" ? (
          <VaultPropertyGrid
            properties={filteredProperties}
            documents={documents}
            members={members}
            onOpenUpload={handleOpenUploadForProperty}
            onOpenCollaborators={handleOpenCollaborators}
            onSwitchToTree={() => setViewMode("TREE")}
            onRefresh={loadVaultData}
          />
        ) : (
          <VaultTree
            documents={documents}
            properties={filteredProperties}
            members={members}
            searchQuery={search}
            selectedCategory={category}
            onOpenUpload={handleOpenUploadForProperty}
            onOpenCollaborators={handleOpenCollaborators}
            onSelectDocument={setSelectedDocForDetails}
            onRefresh={loadVaultData}
          />
        )}
      </div>

      {/* Modals */}
      <DocumentDetailsModal
        isOpen={!!selectedDocForDetails}
        doc={selectedDocForDetails}
        onClose={() => setSelectedDocForDetails(null)}
        onRefresh={loadVaultData}
      />

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadVaultData}
        properties={properties}
        defaultPropertyId={uploadPropertyId}
      />

      <RequestDocumentModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        onSuccess={loadVaultData}
        properties={properties}
      />

      <VaultAccessModal
        isOpen={isAccessOpen}
        onClose={() => setIsAccessOpen(false)}
        onSuccess={loadVaultData}
        properties={properties}
      />

      <FolderCollaboratorsModal
        isOpen={isCollabsOpen}
        onClose={() => {
          setIsCollabsOpen(false);
          setSelectedPropertyForCollabs(null);
        }}
        property={selectedPropertyForCollabs}
        members={members}
        onAccessUpdated={loadVaultData}
      />

      {/* Zambia DPA Compliance Information Modal */}
      <Dialog open={isDpaModalOpen} onOpenChange={setIsDpaModalOpen}>
        <DialogContent className="sm:max-w-[560px] bg-white border-editorial-border text-editorial-black rounded-none shadow-2xl">
          <DialogHeader className="border-b border-editorial-border pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-heading font-bold uppercase tracking-wider text-editorial-black">
              <Scale className="w-4 h-4 text-contour-red" />
              Zambia Data Protection & Land Registry Compliance
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-editorial-muted">
              Statutory framework safeguarding property documents in the Contour ecosystem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-3 text-xs leading-relaxed text-editorial-black">
            <div className="p-3 bg-editorial-bg rounded-none border border-editorial-border">
              <h4 className="font-heading font-bold uppercase text-[11px] tracking-wider text-editorial-black mb-1">
                1. Data Protection Act No. 3 of 2021 (DPA)
              </h4>
              <p className="text-editorial-muted text-xs">
                All personal information including National Registration Card (NRC) numbers, passport scans, and landlord banking details are classified as <strong>Confidential PII</strong>. Storage is encrypted with AES-256 in isolated tenant buckets.
              </p>
            </div>

            <div className="p-3 bg-editorial-bg rounded-none border border-editorial-border">
              <h4 className="font-heading font-bold uppercase text-[11px] tracking-wider text-editorial-black mb-1">
                2. Electronic Communications & Transactions (ECT) Act No. 4 of 2021
              </h4>
              <p className="text-editorial-muted text-xs">
                Authorizes electronic mandates and lease executions. Digital documents stored with SHA-256 verification hashes carry legal admissibility for real estate conveyancing.
              </p>
            </div>

            <div className="p-3 bg-editorial-bg rounded-none border border-editorial-border">
              <h4 className="font-heading font-bold uppercase text-[11px] tracking-wider text-editorial-black mb-1">
                3. Lands and Deeds Registry Act (Cap 185)
              </h4>
              <p className="text-editorial-muted text-xs">
                Certificates of Title are indexed by Ministry of Lands Folio numbers. Property records marked <em>ARCHIVED</em> enter read-only custodial preservation to ensure permanent auditability.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
