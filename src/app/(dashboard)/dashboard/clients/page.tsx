"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Clock,
  ExternalLink,
  Lock,
  X,
  Sparkles,
  Bot,
} from "lucide-react";
import { MotionCard } from "@/components/ui/animate/motion-card";

function ClientsCRMContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1" || searchParams?.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, agentsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/organization/agents"),
        ]);
        const data = await clientsRes.json();
        const agentsData = await agentsRes.json();

        if (agentsData.success && agentsData.agents) {
          setAgents(agentsData.agents);
        }

        if (data.success && data.clients) {
          const normalized = data.clients.map((c: any) => {
            const lockExpiresAt = c.exclusiveLockExpiresAt ? new Date(c.exclusiveLockExpiresAt) : null;
            const daysLeft = lockExpiresAt 
              ? Math.max(0, Math.ceil((lockExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
              : 30;

            const sourceMatch = c.notes?.match(/^\[Source:\s*([^\]]+)\]/);
            const leadSource = c.leadSource || (sourceMatch 
              ? sourceMatch[1] 
              : (c.notes?.includes("[Website Inquiry") ? "Website Portal" : "Portal / Inbound"));
            const cleanNotes = c.notes?.replace(/^\[Source:\s*[^\]]+\]\s*/, "") || c.notes || "Searching for property";

            return {
              id: c.id,
              name: c.clientName,
              phone: c.clientPhone,
              email: c.email || c.clientEmail || "not-provided@client.zm",
              lookingFor: cleanNotes,
              preferredSuburbs: c.preferredSuburbs || [],
              budgetMax: c.budgetMax ? `${c.currency === "USD" ? "$" : "K"} ${Number(c.budgetMax).toLocaleString()}` : "No budget limit",
              purpose: c.lookingFor === "FOR_RENT" ? "RENT" : "BUY",
              leadSource,
              assignedAgent: c.assignedAgent?.name || "Unassigned",
              lockExpiresInDays: daysLeft,
              lastContacted: "Active client",
              status: c.status || "NEW_INQUIRY",
            };
          });
          setClients(normalized);
        }
      } catch (err) {
        console.error("Failed to load CRM clients:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    lookingFor: "",
    preferredSuburbs: "Kabulonga, Woodlands",
    budgetMax: "K 2,500,000",
    purpose: "BUY",
    leadSource: "WALK_IN",
    assignedAgentId: "",
  });
  const [formError, setFormError] = useState("");

  const filteredClients = clients.filter((c) =>
    search.trim() === "" ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lookingFor.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || formData.name.length < 3) {
      setFormError("Client name is required (at least 3 characters).");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 7) {
      setFormError("Valid phone number is required.");
      return;
    }
    if (!formData.lookingFor.trim()) {
      setFormError("Property requirements are required.");
      return;
    }

    const budgetStr = formData.budgetMax.replace(/[^0-9.]/g, "");
    const budgetNum = parseFloat(budgetStr) || undefined;
    const lookingForType = formData.purpose === "RENT" ? "FOR_RENT" : "FOR_SALE";
    const currency = formData.budgetMax.includes("$") ? "USD" : "ZMW";

    const clientPayload = {
      clientName: formData.name,
      clientPhone: formData.phone,
      clientEmail: formData.email || undefined,
      lookingFor: lookingForType,
      propertyType: "STANDALONE_HOUSE",
      budgetMax: budgetNum,
      currency,
      preferredSuburbs: formData.preferredSuburbs.split(",").map((s) => s.trim()),
      notes: `[Source: ${formData.leadSource}] ${formData.lookingFor}`,
      assignedAgentId: formData.assignedAgentId || undefined,
      leadSource: formData.leadSource,
      status: "NEW_INQUIRY",
    };

    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientPayload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.client) {
          const sourceMatch = data.client.notes?.match(/^\[Source:\s*([^\]]+)\]/);
          const leadSource = data.client.leadSource || (sourceMatch ? sourceMatch[1] : formData.leadSource);
          const cleanNotes = data.client.notes?.replace(/^\[Source:\s*[^\]]+\]\s*/, "") || data.client.notes || "";
          const assignedAgentObj = agents.find((a) => a.id === formData.assignedAgentId);

          const newClient = {
            id: data.client.id,
            name: data.client.clientName,
            phone: data.client.clientPhone,
            email: data.client.email || data.client.clientEmail || "not-provided@client.zm",
            lookingFor: cleanNotes,
            preferredSuburbs: data.client.preferredSuburbs || [],
            budgetMax: `${data.client.currency === "USD" ? "$" : "K"} ${Number(data.client.budgetMax || 0).toLocaleString()}`,
            purpose: data.client.lookingFor === "FOR_RENT" ? "RENT" : "BUY",
            leadSource,
            assignedAgent: data.client.assignedAgent?.name || assignedAgentObj?.name || "Unassigned",
            lockExpiresInDays: 30,
            lastContacted: "Just now",
            status: data.client.status || "NEW_INQUIRY",
          };
          setClients([newClient, ...clients]);
          setIsModalOpen(false);
          setFormData({
            name: "",
            phone: "",
            email: "",
            lookingFor: "",
            preferredSuburbs: "Kabulonga, Woodlands",
            budgetMax: "K 2,500,000",
            purpose: "BUY",
            leadSource: "WALK_IN",
            assignedAgentId: "",
          });
          alert(`[SUCCESS] Client ${newClient.name} registered and locked for 30 days!`);
        } else {
          setFormError(data.error || "Failed to save client.");
        }
      })
      .catch((err) => {
        setFormError(`Failed to save client: ${err.message}`);
      });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-editorial-border pb-4 sm:pb-6">
        <div>
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
            CLIENT CUSTODY // CRM PIPELINE
          </span>
          <h1 className="font-serif text-xl sm:text-3xl font-bold text-editorial-black tracking-tight mt-0.5 sm:mt-1">
            Client Inquiries &amp; CRM
          </h1>
          <p className="text-xs text-editorial-neutral mt-0.5 sm:mt-1">
            Buyer and tenant profiles protected by the 30-day anti-poaching lock per closing agent.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-editorial-red" />
          <span>New Client Inquiry</span>
        </button>
      </div>

      {/* 30-Day Anti-Poaching Rule Notice */}
      <div className="bg-editorial-paper/50 border border-editorial-border p-4 sm:p-5 rounded-none flex items-start gap-3">
        <Lock className="w-4 sm:w-5 h-4 sm:h-5 text-editorial-red shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-editorial-black">
          <span className="font-mono font-bold uppercase tracking-wider text-[10px] sm:text-[11px] text-editorial-black block">
            30-Day Anti-Poaching Client Custody Rule
          </span>
          <p className="text-editorial-neutral leading-relaxed">
            When an agent logs a client inquiry, the client is exclusively locked to that agent for 30 days. No other agent in the agency may claim closing commission on this buyer without explicit manager sign-off.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-none p-3 sm:p-4 border border-editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-editorial-paper/40 px-3 py-2 border border-editorial-border flex-1 max-w-md">
          <Search className="w-4 h-4 text-editorial-neutral shrink-0" />
          <input
            type="text"
            placeholder="Search by client name, requirements, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-editorial-black placeholder:text-editorial-neutral focus:outline-none"
          />
        </div>
        <span className="text-xs font-mono font-semibold text-editorial-neutral">
          {filteredClients.length} REGISTERED BUYERS / TENANTS
        </span>
      </div>

      {/* Clients Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-none border border-editorial-border">
          <Bot className="animate-spin w-8 h-8 mb-2 text-editorial-red" />
          <span className="text-xs font-mono text-editorial-neutral">Loading CRM inquiries...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-none border border-editorial-border text-center space-y-3">
          <Users className="w-12 h-12 text-editorial-neutral/50" />
          <h3 className="font-serif font-bold text-editorial-black text-lg">No client inquiries found</h3>
          <p className="text-xs text-editorial-neutral max-w-sm">No prospective buyers or tenants match your query or have been registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map((client) => (
            <MotionCard
              key={client.id}
              withCorners
              className="bg-white rounded-none p-6 border border-editorial-border flex flex-col justify-between space-y-4 hover:border-editorial-black transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-editorial-black">{client.name}</h3>
                    <div className="text-xs text-editorial-neutral mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-editorial-black">{client.phone}</span>
                      <span>•</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-editorial-paper border border-editorial-border text-editorial-black">
                        {client.purpose}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-editorial-paper border border-editorial-border text-editorial-black uppercase tracking-wider">
                    {client.status}
                  </span>
                </div>

                <div className="p-3 bg-editorial-paper/40 border border-editorial-border space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-editorial-neutral font-semibold block uppercase tracking-wider">
                      Looking For:
                    </span>
                    <div className="font-medium text-editorial-black leading-snug">{client.lookingFor}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-editorial-border">
                    <span className="text-[10px] font-mono text-editorial-neutral uppercase">Budget:</span>
                    <span className="font-mono font-bold text-editorial-black">{client.budgetMax}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-editorial-neutral uppercase">Lead Source:</span>
                    <span className="font-mono font-bold text-editorial-red text-xs">{client.leadSource}</span>
                  </div>
                </div>
              </div>

              {/* Anti-Poaching Lock Tag & Agent */}
              <div className="pt-3 border-t border-editorial-border flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-editorial-neutral block">
                    Assigned: <strong className="text-editorial-black">{client.assignedAgent}</strong>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Locked: {client.lockExpiresInDays}d left
                  </span>
                </div>

                <a
                  href={`https://wa.me/${client.phone.replace(/\+/g, "").replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-none bg-editorial-black hover:bg-black text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  WhatsApp
                </a>
              </div>
            </MotionCard>
          ))}
        </div>
      )}

      {/* Interactive Modal: Add New Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-none max-w-lg w-full p-4 sm:p-6 border border-editorial-black space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-editorial-red" />
                <h3 className="font-serif font-bold text-lg text-editorial-black">Register Client Inquiry</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-editorial-neutral hover:text-editorial-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-editorial-red text-xs font-mono font-semibold border border-red-200">
                [VALIDATION ERROR] {formError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kondwani Phiri"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. +260 97 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. k.phiri@outlook.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Property Requirements *</label>
                <input
                  type="text"
                  placeholder="e.g. 4-Bedroom House with Swimming Pool in Kabulonga"
                  value={formData.lookingFor}
                  onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                  className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Budget Max</label>
                  <input
                    type="text"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
                  >
                    <option value="BUY">Buy</option>
                    <option value="RENT">Rent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
                  >
                    <option value="WALK_IN">Walk-in Client</option>
                    <option value="WHATSAPP">WhatsApp Direct</option>
                    <option value="CLIENT_REFERRAL">Client Referral</option>
                    <option value="WEBSITE">Website Ingest</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">Assigned Agent (30d Lock)</label>
                  <select
                    value={formData.assignedAgentId}
                    onChange={(e) => setFormData({ ...formData, assignedAgentId: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-none border border-editorial-border text-editorial-black hover:bg-editorial-paper font-mono text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-none bg-editorial-black hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-editorial-red" />
                  <span>Register &amp; Lock Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientsCRMPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-mono text-editorial-muted">Loading client CRM...</div>}>
      <ClientsCRMContent />
    </React.Suspense>
  );
}
