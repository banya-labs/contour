"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  MapPin,
  Save,
  CheckCircle2,
  Sparkles,
  Palette,
  Code,
  Key,
  Copy,
  Check,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  Upload,
  CreditCard,
  ArrowRight,
  AlertTriangle,
  Ban,
  RefreshCw,
  Lock,
} from "lucide-react";
import {
  getAgencySettings,
  saveAgencySettings,
  formatWorkspaceTitle,
  AgencySettings,
  DEFAULT_AGENCY_SETTINGS,
} from "@/lib/settings/agency-settings";
import { AnimatedTabs } from "@/components/ui/animate/animated-tabs";
import { ContourLogo } from "@/components/brand/contour-logo";

const COLOR_SWATCHES = [
  { name: "Contour Red", hex: "#fa3600" },
  { name: "Editorial Black", hex: "#282828" },
  { name: "Zambia Emerald", hex: "#065F46" },
  { name: "Executive Navy", hex: "#1E3A8A" },
  { name: "Warm Charcoal", hex: "#1C1C1A" },
];

type WorkspaceMember = {
  id: string;
  role: string;
  status: string;
  user: { id: string; name: string; email: string; image?: string | null };
  roleAssignments: Array<{ role: { key: string; displayName: string } }>;
};

type AccessRequest = { id: string; firstName: string; lastName: string; email: string; roleKey: string; createdAt: string };

type WorkspaceInvitation = {
  id: string;
  email: string;
  roleKey: string;
  status: string;
  expiresAt: string;
  label?: string | null;
  inviteUrl?: string;
  inviter?: { id: string; name: string; email: string };
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab")?.toUpperCase() || "BRANDING";

  const [settings, setSettings] = useState<AgencySettings>(DEFAULT_AGENCY_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    ["BRANDING", "ORGANIZATION", "ACCOUNT", "DEVELOPER", "BILLING"].includes(initialTab)
      ? initialTab
      : "BRANDING"
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Developer tab state
  const [apiKeys, setApiKeys] = useState([
    {
      id: "key_01",
      name: "WordPress Main Website",
      key: "contour_live_pg_3f82a17cbef762a1",
      status: "active",
      createdAt: "2026-06-15",
    },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [docSubTab, setDocSubTab] = useState<"FETCH" | "INQUIRE">("FETCH");
  const { data: session } = authClient.useSession();
  const [workspace, setWorkspace] = useState<{ name: string; subscriptionTier: string; subscriptionStatus: string; trialEndsAt: string } | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [roles, setRoles] = useState<Array<{ key: string; displayName: string }>>([]);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteRoleKey, setInviteRoleKey] = useState("FIELD_AGENT");
  const [inviteNote, setInviteNote] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<WorkspaceMember | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [billingSummary, setBillingSummary] = useState<{
    subscription: { planName: string; status: string; trialEndsAt: string; nextPaymentAt: string | null; nextPayment: { formatted: string } | null; lastPayment: { amount: number; currency: string; completedAt: string | null; createdAt: string } | null };
  } | null>(null);

  useEffect(() => {
    setSettings(getAgencySettings());
    void fetch("/api/organization/profile")
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) return;
        setWorkspace(data.organization);
        setSettings((current) => ({
          ...current,
          agencyName: data.organization.name,
          officeAddress: data.organization.profile?.primaryOfficeAddress || current.officeAddress,
          phone: data.organization.profile?.primaryPhone || current.phone,
          email: data.organization.profile?.primaryEmail || current.email,
        }));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeTab !== "ORGANIZATION") return;
    void Promise.all([
      fetch("/api/organization/members"),
      fetch("/api/organization/access-link"),
      fetch("/api/organization/access-requests"),
      fetch("/api/organization/invitations"),
    ])
      .then(async ([membersResponse, linkResponse, requestsResponse, invitationsResponse]) => {
        const membersData = await membersResponse.json();
        const linkData = await linkResponse.json();
        const requestsData = await requestsResponse.json();
        const invitationsData = await invitationsResponse.json().catch(() => ({ success: false }));
        if (membersData.success) { setMembers(membersData.members || []); setRoles(membersData.roles || []); }
        if (requestsData.success) setAccessRequests(requestsData.requests || membersData.accessRequests || []);
        if (invitationsData.success) setInvitations(invitationsData.invitations || []);
        if (linkData.active) setAccessLink("active");
      }).catch(() => undefined);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "BILLING") return;
    void fetch("/api/billing/summary", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (data.success) setBillingSummary(data); })
      .catch(() => undefined);
  }, [activeTab]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveAgencySettings(settings);
    void fetch("/api/organization/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: settings.agencyName, primaryOfficeAddress: settings.officeAddress, primaryPhone: settings.phone, primaryEmail: settings.email }),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/organization/logo", { method: "POST", body });
      const data = await response.json();
      if (response.ok && data.logoUrl) {
        const updated = saveAgencySettings({ ...settings, logoUrl: data.logoUrl });
        setSettings(updated);
        setSettingsMessage("Agency logo updated and saved.");
        return;
      }
    } catch {
      // Fallback to data URL below
    }

    // Client-side fallback if S3 is offline or local dev
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = saveAgencySettings({ ...settings, logoUrl: dataUrl });
      setSettings(updated);
      setSettingsMessage("Agency logo updated and saved.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAgencyLogo = () => {
    const updated = saveAgencySettings({ ...settings, logoUrl: "" });
    setSettings(updated);
    setSettingsMessage("Agency logo removed.");
  };

  const handleCreateAccessLink = async () => {
    setSettingsMessage(null);
    const response = await fetch("/api/organization/access-link", { method: "POST" });
    const data = await response.json();
    if (!response.ok) { setSettingsMessage(data.error || "Unable to create access link."); return; }
    const fullLink = `${window.location.origin}/request-access/${data.token}`;
    setAccessLink(fullLink);
    await navigator.clipboard.writeText(fullLink);
    setSettingsMessage("Access link created and copied. Requests still require admin approval.");
  };

  const handleReviewRequest = async (requestId: string, decision: "APPROVE" | "DECLINE") => {
    const response = await fetch("/api/organization/access-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, decision }) });
    const data = await response.json();
    setSettingsMessage(response.ok ? `Access request ${decision === "APPROVE" ? "approved" : "declined"}.` : data.error || "Unable to review access request.");
    if (response.ok) window.location.reload();
  };

  const handleRoleChange = async (memberId: string, roleKey: string) => {
    const response = await fetch("/api/organization/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, roleKey }),
    });
    const data = await response.json();
    setSettingsMessage(response.ok ? "Member permissions updated." : data.error || "Unable to update permissions.");
    if (response.ok) {
      const refreshed = await fetch("/api/organization/members").then((res) => res.json());
      if (refreshed.success) setMembers(refreshed.members || []);
    }
  };

  const handleGenerateInviteLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsInviting(true);
    setSettingsMessage(null);

    try {
      const res = await fetch("/api/organization/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleKey: inviteRoleKey,
          note: inviteNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      setIsInviting(false);

      if (!res.ok || !data.success) {
        setSettingsMessage(data.error || "Unable to generate invitation link.");
        return;
      }

      setGeneratedInviteLink(data.inviteUrl);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(data.inviteUrl);
      }
      setSettingsMessage(`Active invite link generated for ${inviteRoleKey.replaceAll("_", " ")} and copied to clipboard!`);
      setInviteNote("");

      // Refresh invitations
      const refreshed = await fetch("/api/organization/invitations").then((r) => r.json());
      if (refreshed.success) setInvitations(refreshed.invitations || []);
    } catch {
      setIsInviting(false);
      setSettingsMessage("Network error creating invitation link.");
    }
  };

  const handleToggleSuspend = async (member: WorkspaceMember) => {
    const newStatus = member.status === "suspended" ? "active" : "suspended";
    setSettingsMessage(null);
    try {
      const res = await fetch("/api/organization/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSettingsMessage(data.error || "Failed to update member status.");
        return;
      }
      setSettingsMessage(`Member ${member.user.name} ${newStatus === "suspended" ? "suspended" : "reactivated"}.`);
      const refreshed = await fetch("/api/organization/members").then((r) => r.json());
      if (refreshed.success) setMembers(refreshed.members || []);
    } catch {
      setSettingsMessage("Network error updating member status.");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    setIsDeletingMember(true);
    setSettingsMessage(null);
    try {
      const res = await fetch("/api/organization/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      setIsDeletingMember(false);
      setMemberToDelete(null);

      if (!res.ok || !data.success) {
        setSettingsMessage(data.error || "Failed to remove member.");
        return;
      }

      setSettingsMessage("Member successfully removed from workspace.");
      const refreshed = await fetch("/api/organization/members").then((r) => r.json());
      if (refreshed.success) setMembers(refreshed.members || []);
    } catch {
      setIsDeletingMember(false);
      setMemberToDelete(null);
      setSettingsMessage("Network error removing member.");
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const res = await fetch("/api/organization/invitations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      if (res.ok) {
        setSettingsMessage("Invitation revoked.");
        const refreshed = await fetch("/api/organization/invitations").then((r) => r.json());
        if (refreshed.success) setInvitations(refreshed.invitations || []);
      }
    } catch {
      setSettingsMessage("Failed to revoke invitation.");
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `contour_live_${newKeyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Math.random().toString(36).substring(2, 10)}`,
      status: "active" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k))
    );
  };

  const tabs = [
    { id: "BRANDING", label: "Agency Profile & Brand", icon: Building2 },
    { id: "ORGANIZATION", label: "Team & Permissions", icon: Users },
    { id: "ACCOUNT", label: "My Account & Security", icon: UserCheck },
    { id: "DEVELOPER", label: "API Keys & Integrations", icon: Code },
    { id: "BILLING", label: "Plans & Subscription", icon: CreditCard },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-6 w-full font-geist antialiased text-editorial-black h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-geist font-bold px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
              Agency Governance
            </span>
            <span className="text-[11px] font-geist text-editorial-muted">
              Multi-Tenant Architecture
            </span>
            </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
            Agency Settings & Governance
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
            Manage your corporate real estate identity, invite agents with role-based access control, configure security, and manage API keys.
          </p>
        </div>

        {activeTab === "BRANDING" && (
          <div className="flex items-center gap-3 shrink-0">
            {isSaved && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-heading font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved & Synced</span>
              </div>
            )}

            <button
              onClick={() => handleSave()}
              className="px-5 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-none"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Animate-UI Inspired Sliding Tabs */}
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* TAB 1: AGENCY BRANDING & METADATA */}
      {activeTab === "BRANDING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Left Column: Form Fields (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Identity Card */}
            <div className="p-6 bg-white border border-editorial-border space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-editorial-border">
                <Building2 className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Real Estate Agency Profile
                </h3>
              </div>

              <div className="space-y-4">
                {/* 1. Permanent Contour Workspace Logo (System Managed / Locked) */}
                <div className="pb-4 border-b border-editorial-border/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black">
                      Workspace Application Logo
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-neutral-100 border border-editorial-border text-editorial-muted font-semibold uppercase tracking-wider">
                      <Lock className="w-3 h-3 text-editorial-muted" /> Locked • System Brand
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-editorial-border bg-editorial-black text-xl font-heading font-bold text-white shrink-0 shadow-sm">
                      <ContourLogo size="md" variant="dark" />
                    </div>
                    <div>
                      <p className="text-xs font-heading font-semibold text-editorial-black">Contour System OS</p>
                      <p className="mt-0.5 text-[11px] text-editorial-muted max-w-md">
                        The workspace shell and core system headers always display the official Contour logo. This is permanent and cannot be modified.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Agency Brand Logo (Customizable: Used on Flyers & Generated Reports) */}
                <div className="pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black">
                      Agency Brand Logo
                    </label>
                    <span className="text-[10px] font-mono text-contour-red font-semibold uppercase tracking-wider">
                      Used on Flyers &amp; Reports
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-editorial-border bg-white p-1 shrink-0 shadow-sm">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Agency logo"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs font-heading font-bold text-editorial-muted uppercase border border-dashed border-neutral-300">
                          {settings.agencyName?.substring(0, 2) || "AG"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 bg-editorial-black hover:bg-neutral-800 text-white px-3 py-2 text-[10px] font-heading font-bold uppercase tracking-wider transition-colors shadow-none">
                        <Upload className="h-3.5 w-3.5 text-contour-red" />
                        <span>{settings.logoUrl ? "Change Agency Logo" : "Upload Agency Logo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleLogoUpload(file).catch((error: Error) => setSettingsMessage(error.message));
                          }}
                        />
                      </label>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAgencyLogo}
                          className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-2 text-[10px] font-heading font-semibold uppercase tracking-wider transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-editorial-muted">
                    Your custom agency logo will be rendered on generated social media listing flyers, WhatsApp pitch cards, and official business performance &amp; intelligence reports.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Corporate Agency Name
                  </label>
                  <input
                    type="text"
                    value={settings.agencyName}
                    onChange={(e) =>
                      setSettings({ ...settings, agencyName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                      Zambian REA / Valuation License #
                    </label>
                    <input
                      type="text"
                      value={settings.licenseNumber}
                      onChange={(e) =>
                        setSettings({ ...settings, licenseNumber: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                      PACRA Company Reg #
                    </label>
                    <input
                      type="text"
                      value={settings.pacraNumber || "120240091823"}
                      onChange={(e) =>
                        setSettings({ ...settings, pacraNumber: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Lusaka Office Physical Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-editorial-muted" />
                    <input
                      type="text"
                      value={settings.officeAddress}
                      onChange={(e) =>
                        setSettings({ ...settings, officeAddress: e.target.value })
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Commission Rules */}
            <div className="p-6 bg-white border border-editorial-border space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-editorial-border">
                <Phone className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Contact Channels & Commission Protocol
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                      Official WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={settings.whatsApp}
                      onChange={(e) =>
                        setSettings({ ...settings, whatsApp: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) =>
                        setSettings({ ...settings, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                      Default Sale Commission (%)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultSaleCommission || 5}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultSaleCommission: parseFloat(e.target.value) || 5,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                      Agent Commission Split (%)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultAgentSplit || 50}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultAgentSplit: parseFloat(e.target.value) || 50,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black transition-colors font-geist"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preview & Palette (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Color Swatches */}
            <div className="p-6 bg-white border border-editorial-border space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-editorial-border">
                <Palette className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Brand Color Accent
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() =>
                      setSettings({ ...settings, bannerAccentColor: swatch.hex })
                    }
                    className={`w-9 h-9 border flex items-center justify-center transition-all ${
                      settings.bannerAccentColor === swatch.hex
                        ? "border-editorial-black ring-2 ring-contour-red ring-offset-2"
                        : "border-editorial-border hover:border-editorial-black"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                  >
                    {settings.bannerAccentColor === swatch.hex && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Agency Preview Card */}
            <div className="p-6 bg-neutral-50 border border-editorial-border space-y-4">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">
                Agency Card Preview
              </span>
              <div className="bg-white p-5 border border-editorial-border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 overflow-hidden bg-white border border-editorial-border p-1 flex items-center justify-center font-heading font-bold text-base shadow-sm">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-editorial-black text-white flex items-center justify-center text-xs font-heading font-bold">
                        {settings.agencyName?.substring(0, 2) || "AG"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-editorial-black uppercase">
                      {settings.agencyName || "Lusaka Prime Properties"}
                    </h4>
                    <p className="text-[11px] font-geist text-editorial-muted">
                      License #{settings.licenseNumber || "REA-ZM-8841"}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-geist text-editorial-black pt-2 border-t border-editorial-border space-y-1">
                  <p>📍 {settings.officeAddress || "Plot 4912, Great East Road, Lusaka"}</p>
                  <p>💬 WhatsApp: {settings.whatsApp || "+260 97 100 2000"}</p>
                  <p>⚖️ Default Commission: {settings.defaultSaleCommission || 5}% Standard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BETTER AUTH ORGANIZATION CONTEXT */}
      {activeTab === "ORGANIZATION" && (
        <div className="pt-2">
          <div className="bg-white border border-editorial-border p-4 sm:p-6">
            <div className="mb-6 pb-4 border-b border-editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-base text-editorial-black uppercase tracking-tight">
                  Agency Workspace Members & Role-Based Permissions
                </h3>
                <p className="text-xs font-geist text-editorial-muted mt-1">
                  Invite licensed agents, branch managers, and finance officers. Grant or revoke permissions in real time.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-geist px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
                  Better Auth organization boundary
                </span>
              </div>
            </div>

            {settingsMessage && <p className="mb-4 border border-editorial-border bg-neutral-50 px-3 py-2 text-xs text-editorial-black">{settingsMessage}</p>}

            {/* DIRECT TEAM INVITATION WITH GOOGLE OAUTH & LINK GENERATION */}
            <div className="mb-6 border border-editorial-border bg-white p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-editorial-border">
                <UserPlus className="w-4 h-4 text-contour-red" />
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
                  Generate Team Invite Link
                </h4>
              </div>
              <p className="text-xs text-editorial-muted">
                Generate an official signup link with pre-assigned role permissions. Anyone with this link can sign in with Google or email to join <strong>{settings.agencyName || "this agency"}</strong> without creating a separate workspace. Field agents are directed straight to the field agent PWA.
              </p>

              <form onSubmit={handleGenerateInviteLink} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <label className="sm:w-64 space-y-1">
                  <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                    Assigned Role
                  </span>
                  <select
                    value={inviteRoleKey}
                    onChange={(e) => setInviteRoleKey(e.target.value)}
                    className="w-full px-3 py-2 border border-editorial-border text-xs text-editorial-black bg-white"
                  >
                    <option value="FIELD_AGENT">Field Agent (Field App Only)</option>
                    <option value="BROKER_MANAGER">Broker Manager (Operations & Invites)</option>
                    <option value="ADMIN_STAFF">Admin Staff (Read Access)</option>
                    <option value="FINANCE_OFFICER">Finance Officer (Ledger & Payouts)</option>
                    <option value="VAULT_MANAGER">Vault Manager (Deed Custody)</option>
                  </select>
                </label>

                <label className="flex-1 space-y-1">
                  <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                    Invite Label or Note (Optional)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Lusaka East Field Agents"
                    value={inviteNote}
                    onChange={(e) => setInviteNote(e.target.value)}
                    className="w-full px-3 py-2 border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="bg-editorial-black hover:bg-contour-red px-5 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{isInviting ? "Generating..." : "Generate Invite Link"}</span>
                </button>
              </form>

              {generatedInviteLink && (
                <div className="mt-3 border border-emerald-300 bg-emerald-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Active Invite Link Ready
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedInviteLink, "invite_link")}
                      className="text-[10px] font-bold uppercase tracking-wider text-contour-red hover:underline flex items-center gap-1"
                    >
                      {copiedText === "invite_link" ? "Copied to Clipboard!" : "Copy Link"}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-editorial-black break-all bg-white border border-emerald-200 p-2.5">
                    {generatedInviteLink}
                  </p>
                  <p className="text-[10px] text-editorial-muted">
                    Share this link with your team member. When opened, they can sign in with Google or email and will automatically join this agency workspace with their pre-assigned role.
                  </p>
                </div>
              )}
            </div>

            {/* ACTIVE INVITE LINKS */}
            {invitations.length > 0 && (
              <div className="mb-6 border border-editorial-border bg-white p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-editorial-border">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
                    Active Invite Links ({invitations.length})
                  </h4>
                  <span className="text-[10px] text-editorial-muted font-mono">1-click copy to share</span>
                </div>

                <div className="divide-y divide-editorial-border border border-editorial-border">
                  {invitations.map((inv) => {
                    const fullInviteUrl = inv.inviteUrl || (typeof window !== "undefined"
                      ? `${window.location.origin}/accept-invitation/${inv.id}`
                      : `/accept-invitation/${inv.id}`);

                    return (
                      <div key={inv.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] bg-neutral-100 border border-editorial-border px-2 py-0.5 text-editorial-black uppercase">
                              {inv.roleKey.replaceAll("_", " ")}
                            </span>
                            {inv.label && (
                              <span className="text-xs text-editorial-black font-semibold">
                                {inv.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-editorial-muted">
                            Expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(fullInviteUrl, `inv_${inv.id}`)}
                            className="border border-editorial-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 flex items-center gap-1.5"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>{copiedText === `inv_${inv.id}` ? "Copied!" : "Copy Link"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleRevokeInvite(inv.id)}
                            className="border border-red-200 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 flex items-center gap-1"
                            title="Revoke invitation link"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OPTIONAL PUBLIC ACCESS REQUEST LINK */}
            <div className="mb-6 border border-editorial-border bg-neutral-50 p-4">
              <p className="mb-3 text-xs text-editorial-muted">Alternative: Share a general open link where prospective agents request access for admin review.</p>
              <button type="button" onClick={() => void handleCreateAccessLink()} className="inline-flex items-center justify-center gap-2 bg-editorial-black px-4 py-2 text-[10px] font-heading font-bold uppercase tracking-wider text-white hover:bg-contour-red"><LinkIcon className="h-3.5 w-3.5" /> Create & copy public link</button>
              {accessLink && accessLink !== "active" && <p className="mt-3 break-all border border-editorial-border bg-white px-3 py-2 text-xs text-editorial-black">{accessLink}</p>}
            </div>
            {accessRequests.length > 0 && <div className="mb-6 border border-amber-200 bg-amber-50 p-4"><p className="mb-3 text-[10px] font-heading font-bold uppercase tracking-wider text-amber-900">Pending access requests</p>{accessRequests.map((request) => <div key={request.id} className="mb-2 flex flex-col gap-3 border border-amber-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-editorial-black">{request.firstName} {request.lastName}</p><p className="text-xs text-editorial-muted">{request.email} · requested {request.roleKey.replaceAll("_", " ").toLowerCase()}</p></div><div className="flex gap-2"><button type="button" onClick={() => void handleReviewRequest(request.id, "DECLINE")} className="border border-editorial-border px-3 py-2 text-[10px] font-bold uppercase">Decline</button><button type="button" onClick={() => void handleReviewRequest(request.id, "APPROVE")} className="bg-editorial-black px-3 py-2 text-[10px] font-bold uppercase text-white">Approve</button></div></div>)}</div>}

            {/* ACCEPTED WORKSPACE MEMBERS & MANAGEMENT */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-editorial-border">
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
                    Accepted Workspace Members ({members.length})
                  </h4>
                  <p className="text-[11px] text-editorial-muted">
                    Manage roles, suspend access, or remove members from this agency workspace. Self-deletion and self-suspension are protected.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-editorial-border border border-editorial-border bg-white">
                {members.map((member) => {
                  const isSelf = member.user.id === session?.user?.id;
                  const isOwner = member.role === "owner";
                  const currentRoleKey = member.roleAssignments[0]?.role.key || (isOwner ? "OWNER" : "FIELD_AGENT");
                  const isSuspended = member.status === "suspended";

                  return (
                    <div key={member.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4">
                      {/* Member Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-editorial-black text-white flex items-center justify-center text-xs font-heading font-bold shrink-0">
                          {member.user.name?.slice(0, 2).toUpperCase() || "AG"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-editorial-black truncate">
                              {member.user.name}
                            </p>
                            {isSelf && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-neutral-200 text-editorial-black border border-neutral-300">
                                You
                              </span>
                            )}
                            {isOwner && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300">
                                Workspace Owner
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                                isSuspended
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {isSuspended ? "Suspended" : "Active"}
                            </span>
                          </div>
                          <p className="text-xs text-editorial-muted truncate font-mono">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      {/* Member Actions */}
                      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        {/* Role Selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase text-editorial-muted hidden sm:inline">Role:</span>
                          <select
                            value={currentRoleKey}
                            disabled={isOwner || isSelf}
                            onChange={(event) => void handleRoleChange(member.id, event.target.value)}
                            className="border border-editorial-border bg-white px-2.5 py-1.5 text-xs text-editorial-black disabled:bg-neutral-100 disabled:text-editorial-muted"
                            title={isSelf ? "You cannot reassign your own role" : isOwner ? "Workspace owner role cannot be changed" : "Change member role"}
                          >
                            {isOwner && <option value="OWNER">Owner</option>}
                            {roles
                              .filter((role) => role.key !== "OWNER")
                              .map((role) => (
                                <option key={role.key} value={role.key}>
                                  {role.displayName}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Suspend / Reactivate Button */}
                        <button
                          type="button"
                          disabled={isSelf || isOwner}
                          onClick={() => void handleToggleSuspend(member)}
                          className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                            isSuspended
                              ? "border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                              : "border-amber-300 text-amber-800 hover:bg-amber-50"
                          } disabled:opacity-40 disabled:pointer-events-none`}
                          title={isSelf ? "You cannot suspend your own account" : isOwner ? "Owner cannot be suspended" : isSuspended ? "Reactivate member access" : "Suspend member access"}
                        >
                          {isSuspended ? "Reactivate" : "Suspend"}
                        </button>

                        {/* Delete / Remove Member Button */}
                        {!isSelf && !isOwner && (
                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 transition-colors"
                            title="Remove member from workspace"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <p className="p-4 text-xs text-editorial-muted">No active members found yet.</p>
                )}
              </div>
            </div>

            {/* DELETE MEMBER CONFIRMATION MODAL */}
            {memberToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md bg-white border border-editorial-border p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center gap-2 pb-2 border-b border-editorial-border text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-heading font-bold text-sm uppercase tracking-wider">
                      Remove Workspace Member
                    </h4>
                  </div>
                  <p className="text-xs text-editorial-black leading-relaxed">
                    Are you sure you want to remove <strong>{memberToDelete.user.name}</strong> (
                    <span className="font-mono">{memberToDelete.user.email}</span>) from{" "}
                    <strong>{settings.agencyName || "this agency"}</strong>?
                  </p>
                  <p className="text-[11px] text-editorial-muted">
                    They will immediately lose access to all agency properties, leads, pipeline, and vault records.
                  </p>
                  <div className="flex justify-end gap-2 pt-2 border-t border-editorial-border">
                    <button
                      type="button"
                      disabled={isDeletingMember}
                      onClick={() => setMemberToDelete(null)}
                      className="px-4 py-2 border border-editorial-border text-xs font-bold uppercase tracking-wider text-editorial-black hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingMember}
                      onClick={() => void handleDeleteMember(memberToDelete.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingMember ? "Removing..." : "Confirm Remove"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-editorial-border bg-neutral-50 p-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Authenticated user</p>
                <p className="mt-2 text-sm font-semibold text-editorial-black">{session?.user.name || "Loading..."}</p>
                <p className="text-xs text-editorial-muted">{session?.user.email || ""}</p>
              </div>
              <div className="border border-editorial-border bg-neutral-50 p-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Workspace membership</p>
                <p className="mt-2 text-sm font-semibold text-editorial-black">
                  {formatWorkspaceTitle(settings.agencyName)}
                </p>
                <p className="text-xs text-editorial-muted">Share an access link, then approve or decline requests from this panel.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BETTER AUTH USER ACCOUNT & SECURITY */}
      {activeTab === "ACCOUNT" && (
        <div className="pt-2">
          <div className="bg-white border border-editorial-border p-4 sm:p-6">
            <div className="mb-6 pb-4 border-b border-editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-base text-editorial-black uppercase tracking-tight">
                  Personal Account & Security Credentials
                </h3>
                <p className="text-xs font-geist text-editorial-muted mt-1">
                  Manage your personal email addresses, phone verification, password, two-factor authentication, and active sessions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-geist px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-800 uppercase tracking-wider font-semibold">
                  POPIA Encrypted
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-editorial-border p-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Account email</p>
                <p className="mt-2 text-sm font-semibold text-editorial-black">{session?.user.email || "Loading..."}</p>
              </div>
              <div className="border border-editorial-border p-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Authentication providers</p>
                <p className="mt-2 text-xs text-editorial-muted">Email/password is enabled. Google OAuth is available when the server Google credentials are configured.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "BILLING" && (
        <div className="space-y-6 pt-2">
          <div className="border border-editorial-black bg-editorial-black p-6 text-white">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-white/60">Workspace billing</p><h3 className="mt-2 font-heading text-2xl font-bold">Know what you have, what is next, and what it costs.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{billingSummary?.subscription.status === "trialing" ? `You are on ${billingSummary.subscription.planName}. Your trial ends ${billingSummary.subscription.trialEndsAt ? new Date(billingSummary.subscription.trialEndsAt).toLocaleDateString("en-ZM", { day: "numeric", month: "long", year: "numeric" }) : "soon"}.` : `You are on ${billingSummary?.subscription.planName || workspace?.subscriptionTier || "Starter"}. Your billing status is ${billingSummary?.subscription.status || workspace?.subscriptionStatus || "trialing"}.`}</p></div>
              <a href="/dashboard/billing" className="inline-flex shrink-0 items-center justify-center bg-contour-red px-4 py-3 text-[10px] font-heading font-bold uppercase tracking-wider text-white hover:bg-white hover:text-editorial-black">View plans & billing</a>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="border border-white/20 p-4"><p className="text-[10px] font-heading font-bold uppercase tracking-wider text-white/60">Current plan</p><p className="mt-2 text-lg font-semibold">{billingSummary?.subscription.planName || workspace?.subscriptionTier || "Loading…"}</p></div><div className="border border-white/20 p-4"><p className="text-[10px] font-heading font-bold uppercase tracking-wider text-white/60">Next payment</p><p className="mt-2 text-lg font-semibold">{billingSummary?.subscription.nextPayment?.formatted || "Not scheduled"}</p><p className="mt-1 text-xs text-white/60">{billingSummary?.subscription.nextPaymentAt ? new Date(billingSummary.subscription.nextPaymentAt).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" }) : "After first payment"}</p></div><div className="border border-white/20 p-4"><p className="text-[10px] font-heading font-bold uppercase tracking-wider text-white/60">Last payment</p><p className="mt-2 text-lg font-semibold">{billingSummary?.subscription.lastPayment ? `${billingSummary.subscription.lastPayment.currency} ${billingSummary.subscription.lastPayment.amount.toLocaleString()}` : "No payments yet"}</p><p className="mt-1 text-xs text-white/60">Receipts are available in billing.</p></div></div>
          </div>
          <div className="border border-editorial-border bg-white p-5"><p className="text-sm font-semibold text-editorial-black">Need to change your plan?</p><p className="mt-1 text-xs leading-5 text-editorial-muted">Compare all three tiers, see their features and limits, choose monthly or annual billing, and start payment from the billing workspace.</p><a href="/dashboard/billing#plans" className="mt-4 inline-flex items-center gap-2 text-[10px] font-heading font-bold uppercase tracking-wider text-contour-red">Compare plans <ArrowRight className="h-3.5 w-3.5" /></a></div>
        </div>
      )}

      {/* TAB 4: DEVELOPER & MCP KEYS */}
      {activeTab === "DEVELOPER" && (
        <div className="space-y-6 pt-2">
          {/* Key Generator */}
          <div className="p-6 bg-white border border-editorial-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Named Machine & API Keys
                </h3>
              </div>
              <span className="text-[10px] font-geist text-editorial-muted">
                HTTP Bearer Tokens
              </span>
            </div>

            <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Key label (e.g. 'Marketing Website', 'Cursor IDE')..."
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 border border-editorial-border text-xs text-editorial-black focus:outline-none focus:border-editorial-black font-geist"
              />
              <button
                type="submit"
                disabled={!newKeyName.trim()}
                className="px-4 py-2 bg-editorial-black hover:bg-contour-red disabled:opacity-40 text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-none shrink-0"
              >
                Generate Key
              </button>
            </form>

            {/* Mobile Keys List (md:hidden) */}
            <div className="md:hidden divide-y divide-editorial-border border border-editorial-border p-3 space-y-3 font-geist text-xs">
              {apiKeys.map((k) => (
                <div key={k.id} className="pt-2 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-editorial-black">{k.name}</span>
                    <span
                      className={`text-[9px] font-heading font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                        k.status === "active"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-neutral-100 text-editorial-muted border-editorial-border"
                      }`}
                    >
                      {k.status}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-editorial-muted break-all">
                    {k.key.substring(0, 16)}••••••••
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-editorial-muted pt-1">
                    <span>Created {k.createdAt}</span>
                    {k.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleRevokeKey(k.id)}
                        className="font-heading font-semibold text-contour-red hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Keys Table (hidden md:block) */}
            <div className="hidden md:block border border-editorial-border overflow-x-auto">
              <table className="w-full text-left text-xs font-geist">
                <thead className="bg-neutral-50 border-b border-editorial-border font-heading font-semibold text-[11px] uppercase tracking-wider text-editorial-muted">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Key Token</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-editorial-border">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-3 font-medium text-editorial-black">
                        {k.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-editorial-muted">
                        {k.key.substring(0, 16)}••••••••
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-heading font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                            k.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-neutral-100 text-editorial-muted border-editorial-border"
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-editorial-muted">
                        {k.createdAt}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {k.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-xs font-heading font-semibold text-contour-red hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* External Integration Code Snippets */}
          <div className="p-4 sm:p-6 bg-white border border-editorial-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-editorial-border">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Public Integration Endpoints
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDocSubTab("FETCH")}
                  className={`px-3 py-1 text-xs font-heading font-semibold uppercase tracking-wider border ${
                    docSubTab === "FETCH"
                      ? "bg-editorial-black text-white border-editorial-black"
                      : "bg-white text-editorial-black border-editorial-border hover:bg-neutral-50"
                  }`}
                >
                  1. GET Listings
                </button>
                <button
                  type="button"
                  onClick={() => setDocSubTab("INQUIRE")}
                  className={`px-3 py-1 text-xs font-heading font-semibold uppercase tracking-wider border ${
                    docSubTab === "INQUIRE"
                      ? "bg-editorial-black text-white border-editorial-black"
                      : "bg-white text-editorial-black border-editorial-border hover:bg-neutral-50"
                  }`}
                >
                  2. POST Inquiries
                </button>
              </div>
            </div>

            {docSubTab === "FETCH" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-editorial-black uppercase">
                    GET /api/properties
                  </span>
                  <span className="text-[10px] font-geist text-emerald-800 font-semibold px-2 py-0.5 border border-emerald-300 bg-emerald-50">
                    Public Read • Sandbox Safe
                  </span>
                </div>
                <p className="text-editorial-muted text-xs">
                  Call this endpoint directly from your corporate website or Webflow. It strictly filters out landlord PII and returns active listings.
                </p>
                <div className="relative">
                  <pre className="p-4 bg-editorial-black text-white font-mono text-[11px] overflow-x-auto leading-relaxed border border-editorial-black">
{`// Fetch available properties from Contour
fetch('https://app.contour.co.zm/api/properties?status=AVAILABLE')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('Active listings:', data.properties);
    }
  });`}
                  </pre>
                  <button
                    onClick={() =>
                      handleCopy(
                        `fetch('https://app.contour.co.zm/api/properties?status=AVAILABLE')\n  .then(res => res.json())\n  .then(data => {\n    if (data.success) {\n      console.log('Active listings:', data.properties);\n    }\n  });`,
                        "fetch_code"
                      )
                    }
                    className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 text-white"
                    title="Copy Code"
                  >
                    {copiedText === "fetch_code" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-editorial-black uppercase">
                    POST /api/inquiries
                  </span>
                  <span className="text-[10px] font-geist text-contour-red font-semibold px-2 py-0.5 border border-contour-red/30 bg-contour-red/5">
                    Rate Limited • Lead Assigned
                  </span>
                </div>
                <p className="text-editorial-muted text-xs">
                  Submit inquiries directly from your website contact forms. Leads immediately route into your Contour CRM pipeline.
                </p>
                <div className="relative">
                  <pre className="p-4 bg-editorial-black text-white font-mono text-[11px] overflow-x-auto leading-relaxed border border-editorial-black">
{`// Submit lead from your website inquiry form to Contour
fetch('https://app.contour.co.zm/api/inquiries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientName: 'Dr. Mutale Kapwepwe',
    clientPhone: '+260977112233',
    clientEmail: 'mutale@example.com',
    propertyId: 'prop_01',
    notes: 'Interested in viewing this house.'
  })
})
.then(res => res.json())
.then(data => console.log('Lead submitted:', data));`}
                  </pre>
                  <button
                    onClick={() =>
                      handleCopy(
                        `fetch('https://app.contour.co.zm/api/inquiries', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    clientName: 'Dr. Mutale Kapwepwe',\n    clientPhone: '+260977112233',\n    clientEmail: 'mutale@example.com',\n    propertyId: 'prop_01',\n    notes: 'Interested in viewing this house.'\n  })\n})\n.then(res => res.json())\n.then(data => console.log('Lead submitted:', data));`,
                        "inquiry_code"
                      )
                    }
                    className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 text-white"
                    title="Copy Code"
                  >
                    {copiedText === "inquiry_code" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgencySettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-geist text-editorial-muted">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
