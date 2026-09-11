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
} from "lucide-react";
import {
  getAgencySettings,
  saveAgencySettings,
  AgencySettings,
  DEFAULT_AGENCY_SETTINGS,
} from "@/lib/settings/agency-settings";
import { AnimatedTabs } from "@/components/ui/animate/animated-tabs";

const COLOR_SWATCHES = [
  { name: "Contour Red", hex: "#fa3600" },
  { name: "Editorial Black", hex: "#282828" },
  { name: "Zambia Emerald", hex: "#065F46" },
  { name: "Executive Navy", hex: "#1E3A8A" },
  { name: "Warm Charcoal", hex: "#1C1C1A" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab")?.toUpperCase() || "BRANDING";

  const [settings, setSettings] = useState<AgencySettings>(DEFAULT_AGENCY_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    ["BRANDING", "ORGANIZATION", "ACCOUNT", "DEVELOPER"].includes(initialTab)
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

  useEffect(() => {
    setSettings(getAgencySettings());
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveAgencySettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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
                  <div className="w-10 h-10 bg-editorial-black text-white flex items-center justify-center font-heading font-bold text-base">
                    {settings.agencyName ? settings.agencyName[0] : "C"}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-editorial-border bg-neutral-50 p-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Authenticated user</p>
                <p className="mt-2 text-sm font-semibold text-editorial-black">{session?.user.name || "Loading..."}</p>
                <p className="text-xs text-editorial-muted">{session?.user.email || ""}</p>
              </div>
              <div className="border border-editorial-border bg-neutral-50 p-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted">Workspace membership</p>
                <p className="mt-2 text-sm font-semibold text-editorial-black">Contour Agency Workspace</p>
                <p className="text-xs text-editorial-muted">Organization administration will be enabled in the tenancy phase.</p>
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
