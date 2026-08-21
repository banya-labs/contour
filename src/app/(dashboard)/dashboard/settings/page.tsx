"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Share2,
  Instagram,
  Facebook,
  Image as ImageIcon,
  Palette,
  Check,
  HelpCircle,
  Upload,
  Code,
  Key,
  Terminal,
  Copy,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import {
  getAgencySettings,
  saveAgencySettings,
  AgencySettings,
  DEFAULT_AGENCY_SETTINGS,
} from "@/lib/settings/agency-settings";

const COLOR_SWATCHES = [
  { name: "Contour Burgundy", hex: "#8B1E1E" },
  { name: "Executive Navy", hex: "#1E3A8A" },
  { name: "Zambia Emerald", hex: "#065F46" },
  { name: "Warm Amber", hex: "#D97706" },
  { name: "Charcoal Black", hex: "#1C1C1A" },
];

export default function AgencySettingsPage() {
  const [settings, setSettings] = useState<AgencySettings>(DEFAULT_AGENCY_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"BRANDING" | "DEVELOPER">("BRANDING");
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

  return (
    <div className="p-4 sm:p-8 pb-32 sm:pb-40 space-y-8 max-w-7xl mx-auto w-full font-sans antialiased text-ink-900 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-paper-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-contour-red/10 text-contour-red uppercase tracking-wider">
              Agency Governance & Brand Engine
            </span>
            <span className="text-[11px] font-medium text-ink-500">• Single Tenant Workspace</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
            Agency Branding & Developer Settings
          </h1>
          <p className="text-xs sm:text-sm text-ink-600 mt-1 max-w-3xl">
            Configure your brand identity and public API keys to easily showcase listings on your own corporate website and automate client inquiry ingestion.
          </p>
        </div>

        {activeTab === "BRANDING" && (
          <div className="flex items-center gap-3 shrink-0">
            {isSaved && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved & Synced!</span>
              </div>
            )}

            <button
              onClick={() => handleSave()}
              className="px-6 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-bold shadow-subtle flex items-center gap-2 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4 text-contour-red" />
              <span>Save Agency Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-paper-300 gap-6 pb-px">
        <button
          onClick={() => setActiveTab("BRANDING")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "BRANDING"
              ? "border-contour-red text-ink-900 border-b-[2px]"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          Agency Profile & Branding
        </button>
        <button
          onClick={() => setActiveTab("DEVELOPER")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "DEVELOPER"
              ? "border-contour-red text-ink-900 border-b-[2px]"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          API & Website Integration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {activeTab === "BRANDING" ? (
          <>
            {/* Left Column: Form Editor (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Agency Trading Identity */}
              <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
                <div className="px-6 py-4 bg-paper-100/70 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-contour-red text-white flex items-center justify-center font-bold text-sm shadow-subtle">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-ink-900">
                        Agency Trading Identity
                      </h3>
                      <p className="text-[11px] text-ink-600">Company name, logo, and brand colorway</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Verified Mandate Firm
                  </span>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-ink-900 mb-1.5">
                      Agency Trading Name <span className="text-contour-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings.agencyName}
                      onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
                      placeholder="e.g. Contour Real Estate Zambia Ltd"
                      className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 font-semibold focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink-900 mb-1.5">
                      Tagline / Brand Slogan
                    </label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      placeholder="e.g. Lusaka's Premier Property Advisory & Mandate Vault"
                      className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red transition-all"
                    />
                  </div>

                  {/* Brand Accent Palette */}
                  <div>
                    <label className="block font-bold text-ink-900 mb-1.5">
                      Brand Accent Banner Color
                    </label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => setSettings({ ...settings, bannerAccentColor: swatch.hex })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              settings.bannerAccentColor.toLowerCase() === swatch.hex.toLowerCase()
                                ? "border-ink-900 bg-paper-200 shadow-xs"
                                : "border-border bg-white hover:bg-paper-100"
                            }`}
                          >
                            <span
                              style={{ backgroundColor: swatch.hex }}
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                            />
                            <span className="text-[11px]">{swatch.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center gap-2">
                          <input
                            type="color"
                            value={settings.bannerAccentColor}
                            onChange={(e) => setSettings({ ...settings, bannerAccentColor: e.target.value })}
                            className="w-9 h-9 rounded-xl border border-border cursor-pointer p-0.5 bg-white shrink-0"
                          />
                          <input
                            type="text"
                            value={settings.bannerAccentColor}
                            onChange={(e) => setSettings({ ...settings, bannerAccentColor: e.target.value })}
                            className="w-28 bg-paper-100/60 px-3 py-2 rounded-xl border border-border text-ink-900 font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                          />
                        </div>
                        <span className="text-[11px] text-ink-500">
                          Applied to social flyers, report headers, and statement stamps.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block font-bold text-ink-900 mb-1.5">
                      Agency Logo URL / Asset
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-paper-200 border border-paper-300 shrink-0 flex items-center justify-center">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-ink-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={settings.logoUrl}
                        onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Channels & Social Handles */}
              <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
                <div className="px-6 py-4 bg-paper-100/70 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-subtle">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-ink-900">
                        Public Contact & Digital Channels
                      </h3>
                      <p className="text-[11px] text-ink-600">WhatsApp, official phone lines, and social links</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        WhatsApp Business Line <span className="text-contour-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={settings.whatsApp}
                        onChange={(e) => setSettings({ ...settings, whatsApp: e.target.value })}
                        placeholder="+260 97 123 4567"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                        required
                      />
                      <span className="text-[10px] text-ink-500 mt-1 block">Primary CTA on all marketing flyers</span>
                    </div>

                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        Main Office Phone Line
                      </label>
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        placeholder="+260 211 123456"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 font-mono focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        Official Inquiries Email
                      </label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        placeholder="mandates@contour.co.zm"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        Official Agency Website
                      </label>
                      <input
                        type="text"
                        value={settings.website}
                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                        placeholder="www.contour.co.zm"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 font-mono focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        Instagram Handle
                      </label>
                      <input
                        type="text"
                        value={settings.instagramHandle}
                        onChange={(e) => setSettings({ ...settings, instagramHandle: e.target.value })}
                        placeholder="@contour.zambia"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        Facebook Page
                      </label>
                      <input
                        type="text"
                        value={settings.facebookPage}
                        onChange={(e) => setSettings({ ...settings, facebookPage: e.target.value })}
                        placeholder="Contour Real Estate Zambia"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink-900 mb-1.5">
                      Office / Branch Address
                    </label>
                    <input
                      type="text"
                      value={settings.officeAddress}
                      onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
                      placeholder="e.g. Suite 402, Centro Mall Complex, Kabulonga, Lusaka"
                      className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Legal & Regulatory Compliance */}
              <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
                <div className="px-6 py-4 bg-paper-100/70 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-ink-900 text-white flex items-center justify-center font-bold text-sm shadow-subtle">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-ink-900">
                        Zambia Regulatory & Licensing Compliance
                      </h3>
                      <p className="text-[11px] text-ink-600">ZREIC & PACRA registration details</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        ZREIC License Number
                      </label>
                      <input
                        type="text"
                        value={settings.licenseNumber}
                        onChange={(e) => setSettings({ ...settings, licenseNumber: e.target.value })}
                        placeholder="ZREIC/LUS/2026/0488"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red"
                      />
                      <span className="text-[10px] text-ink-500 mt-1 block">Printed on all legal mandate contracts</span>
                    </div>

                    <div>
                      <label className="block font-bold text-ink-900 mb-1.5">
                        PACRA Registration Ref
                      </label>
                      <input
                        type="text"
                        defaultValue="PACRA-ZAM-120993"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 font-mono focus:outline-none"
                        disabled
                      />
                      <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Verified & Active ✅</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Save Trigger */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleSave()}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-bold shadow-floating flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4 text-contour-red" />
                  <span>Save & Publish Agency Settings</span>
                </button>
              </div>
            </div>

            {/* Right Column: Sticky Live Preview Canvas (5 Cols) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-ink-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-contour-red" />
                  <span>Live Flyer Auto-Branding Preview</span>
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-paper-200 text-ink-800 border border-paper-300">
                  Live Preview
                </span>
              </div>

              {/* Rendered Social Flyer Card */}
              <div className="p-5 rounded-3xl bg-ink-950 text-white shadow-2xl space-y-4 border border-ink-800">
                {/* Top Brand Banner with Custom Accent Color */}
                <div
                  style={{ backgroundColor: settings.bannerAccentColor || "#8B1E1E" }}
                  className="p-3.5 rounded-2xl flex items-center justify-between transition-colors shadow-subtle"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-serif font-bold text-sm text-white">
                      C
                    </div>
                    <div>
                      <div className="font-serif font-bold text-xs text-white tracking-wide uppercase leading-tight truncate max-w-[170px]">
                        {settings.agencyName || "Contour Real Estate Zambia"}
                      </div>
                      <div className="text-[9px] text-white/80 font-mono">
                        Lic: {settings.licenseNumber || "ZREIC/LUS/2026/0488"}
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-white text-ink-950 uppercase tracking-wider shadow-xs">
                    FOR SALE 🔴
                  </span>
                </div>

                {/* Sample Property Image */}
                <div className="relative h-44 rounded-2xl overflow-hidden bg-ink-900 group border border-ink-800">
                  <img
                    src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"
                    alt="Sample Property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Kabulonga, Lusaka
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 text-contour-red font-mono font-bold text-xs px-3 py-1 rounded-full shadow-subtle">
                    K 3,500,000
                  </div>
                </div>

                {/* Title & Specs */}
                <div className="space-y-1.5 px-1">
                  <h4 className="font-serif font-bold text-sm text-white line-clamp-1">
                    Executive 4-Bedroom Standalone Residence
                  </h4>
                  <p className="text-[10px] text-ink-400 line-clamp-1">
                    📍 200m off Kabulonga Road • 2,400 m² plot with private pool
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-ink-300 pt-2 border-t border-ink-800/80 font-mono">
                    <span>🛏️ 4 Beds</span>
                    <span>🛁 3.5 Baths</span>
                    <span>📐 2,400 m²</span>
                    <span>💧 Borehole</span>
                  </div>
                </div>

                {/* Footer Contact Banner */}
                <div className="p-3 bg-ink-900 rounded-2xl border border-ink-800 flex items-center justify-between text-[10px]">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>💬 WhatsApp:</span>{" "}
                      <span className="text-emerald-400 font-mono">{settings.whatsApp || "+260 97 123 4567"}</span>
                    </div>
                    <div className="text-ink-400 font-mono mt-0.5">{settings.website || "www.contour.co.zm"}</div>
                  </div>
                  <div className="text-right text-ink-400">
                    <div className="font-medium">{settings.instagramHandle || "@contour.zambia"}</div>
                    <div className="text-[9px] text-emerald-400 font-bold mt-0.5">Mandate Verified ✅</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-paper-100 border border-paper-200 text-xs text-ink-700 space-y-1.5">
                <div className="font-bold text-ink-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-contour-red" />
                  <span>How this branding is used:</span>
                </div>
                <p className="text-[11px] text-ink-600 leading-relaxed">
                  Every time an agent clicks <strong>"Social Card"</strong> on any property in the catalog, this agency profile, logo, WhatsApp line, and license details are automatically embedded into the 1:1, 4:5, and 9:16 flyers for social media.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Left Column: API Manager & Docs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* API Key Generation */}
              <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
                <div className="px-6 py-4 bg-paper-100/70 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-ink-900 text-white flex items-center justify-center font-bold text-sm shadow-subtle">
                      <Key className="w-4 h-4 text-contour-red" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-ink-900">
                        Developer Access & API Credentials
                      </h3>
                      <p className="text-[11px] text-ink-600">Provide keys for external web developer integrations</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  {/* Generate Key Form */}
                  <form onSubmit={handleGenerateKey} className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Website Lead Form Integrator"
                        className="w-full bg-paper-100/60 px-4 py-2.5 rounded-xl border border-border text-ink-900 focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-ink-900 hover:bg-ink-950 text-white rounded-xl font-bold transition-all shadow-subtle shrink-0"
                    >
                      Generate API Key
                    </button>
                  </form>

                  {/* Keys list */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-ink-900 text-xs">Your Tenant API Keys</h4>
                    {apiKeys.length === 0 ? (
                      <p className="text-ink-500 italic py-2">No active API keys found. Generate one above.</p>
                    ) : (
                      <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-paper-50">
                        {apiKeys.map((k) => (
                          <div key={k.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-ink-900 truncate">{k.name}</span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    k.status === "active"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-red-50 text-red-700 border border-red-100"
                                  }`}
                                >
                                  {k.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="font-mono text-[10px] text-ink-500 truncate max-w-xs sm:max-w-md">
                                {k.key}
                              </div>
                              <div className="text-[10px] text-ink-400">Created: {k.createdAt}</div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {k.status === "active" ? (
                                <>
                                  <button
                                    onClick={() => handleCopy(k.key, k.id)}
                                    className="p-2 hover:bg-paper-200 text-ink-600 rounded-lg transition-colors border border-border bg-white"
                                    title="Copy API Key"
                                    type="button"
                                  >
                                    {copiedText === k.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRevokeKey(k.id)}
                                    className="px-3 py-1.5 border border-red-200 text-red-700 bg-white hover:bg-red-50 text-[10px] font-bold rounded-lg transition-colors"
                                    type="button"
                                  >
                                    Revoke
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-ink-400 italic">Inactive</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Developer Documentation Swapper */}
              <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
                <div className="px-6 py-4 bg-paper-100/70 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-ink-900 text-white flex items-center justify-center font-bold text-sm shadow-subtle">
                      <Terminal className="w-4 h-4 text-contour-red" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-ink-900">
                        Integration Guide & Code Snippets
                      </h3>
                      <p className="text-[11px] text-ink-600">Copy code to give to your developer for website sync</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {/* Doc Sub Tabs */}
                  <div className="flex gap-2 border-b border-paper-200 pb-2">
                    <button
                      onClick={() => setDocSubTab("FETCH")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        docSubTab === "FETCH"
                          ? "bg-ink-900 text-white border-ink-900"
                          : "bg-white text-ink-700 border-border hover:bg-paper-50"
                      }`}
                    >
                      1. Show Listings (GET API)
                    </button>
                    <button
                      onClick={() => setDocSubTab("INQUIRE")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        docSubTab === "INQUIRE"
                          ? "bg-ink-900 text-white border-ink-900"
                          : "bg-white text-ink-700 border-border hover:bg-paper-50"
                      }`}
                    >
                      2. Capture Inquiries (POST API)
                    </button>
                  </div>

                  {docSubTab === "FETCH" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink-800">Endpoint: GET /api/properties</span>
                        <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                          Public Read • Sandbox Safe
                        </span>
                      </div>
                      <p className="text-ink-600 leading-relaxed text-[11px]">
                        Call this endpoint directly from your browser JavaScript (e.g. in your Webflow Custom Code or custom theme). It strictly filters out landlord PII and sensitive info automatically.
                      </p>

                      <div className="relative">
                        <pre className="p-4 bg-ink-950 text-white rounded-2xl font-mono text-[10px] overflow-x-auto leading-relaxed border border-ink-800">
{`// Fetch your available properties from Contour
fetch('https://app.contour.co.zm/api/properties?org=contour-demo&status=AVAILABLE')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('Listings fetched:', data.properties);
      // Map listings into your HTML cards here
    }
  });`}
                        </pre>
                        <button
                          onClick={() =>
                            handleCopy(
                              `fetch('https://app.contour.co.zm/api/properties?org=contour-demo&status=AVAILABLE')\n  .then(res => res.json())\n  .then(data => {\n    if (data.success) {\n      console.log('Listings fetched:', data.properties);\n    }\n  });`,
                              "fetch_snippet"
                            )
                          }
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                          title="Copy Code"
                          type="button"
                        >
                          {copiedText === "fetch_snippet" ? (
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
                        <span className="font-bold text-ink-800">Endpoint: POST /api/inquiries</span>
                        <span className="text-[10px] text-contour-red font-semibold px-2 py-0.5 rounded-full bg-contour-red/5 border border-contour-red/10">
                          Rate Limited • Spam Guarded
                        </span>
                      </div>
                      <p className="text-ink-600 leading-relaxed text-[11px]">
                        Submit inquiries from your custom website forms. Inquiries will immediately enter your Contour CRM workspace and assign the property agent automatically.
                      </p>

                      <div className="relative">
                        <pre className="p-4 bg-ink-950 text-white rounded-2xl font-mono text-[10px] overflow-x-auto leading-relaxed border border-ink-800">
{`// Submit lead from your website inquiry form to Contour
fetch('https://app.contour.co.zm/api/inquiries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    org: 'contour-demo',
    clientName: 'John Banda',
    clientPhone: '+260977112233',
    clientEmail: 'john@example.com',
    propertyId: 'prop_01', // Optional
    notes: 'Interested in viewing this house.'
  })
})
.then(res => res.json())
.then(data => console.log('Lead submitted:', data));`}
                        </pre>
                        <button
                          onClick={() =>
                            handleCopy(
                              `fetch('https://app.contour.co.zm/api/inquiries', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    org: 'contour-demo',\n    clientName: 'John Banda',\n    clientPhone: '+260977112233',\n    clientEmail: 'john@example.com',\n    propertyId: 'prop_01',\n    notes: 'Interested in viewing this house.'\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
                              "inquiry_snippet"
                            )
                          }
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                          title="Copy Code"
                          type="button"
                        >
                          {copiedText === "inquiry_snippet" ? (
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
            </div>

            {/* Right Column: Interactive Card Preview (5 Cols) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-ink-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-contour-red" />
                  <span>External Website Card Preview</span>
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-paper-200 text-ink-800 border border-paper-300">
                  Client Frontend
                </span>
              </div>

              {/* Website Card Mock */}
              <div className="p-4 rounded-3xl bg-white border border-border shadow-card space-y-3 text-ink-900">
                {/* Image */}
                <div className="relative h-40 rounded-2xl overflow-hidden bg-paper-100 border border-paper-200">
                  <img
                    src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"
                    alt="Sample Property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Kabulonga, Lusaka
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-white text-ink-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded-lg border border-border">
                    K 3,500,000
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-1">
                  <h4 className="font-bold text-xs line-clamp-1">
                    Executive 4-Bedroom Standalone Residence
                  </h4>
                  <p className="text-[10px] text-ink-500 line-clamp-1">
                    📍 200m off Kabulonga Road • 2,400 m² plot
                  </p>
                </div>

                <div className="pt-3 border-t border-paper-200 flex items-center justify-between">
                  <div className="text-[10px] text-ink-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto-sync Status: Active</span>
                  </div>
                  <button className="px-3.5 py-1.5 bg-ink-900 hover:bg-ink-950 text-white text-[10px] font-bold rounded-xl transition-all shadow-subtle">
                    Contact Agency
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-paper-100 border border-paper-200 text-xs text-ink-700 space-y-1.5">
                <div className="font-bold text-ink-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-contour-red" />
                  <span>Auto-Sync Details</span>
                </div>
                <p className="text-[11px] text-ink-600 leading-relaxed">
                  Whenever an agent marks a listing as <strong>Sold</strong>, <strong>Rented</strong>, or edits pricing inside Contour, the client website updates its cards immediately on page reload.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
