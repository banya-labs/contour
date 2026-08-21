"use client";

import React, { useState, useEffect } from "react";
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

export default function ClientsCRMPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (data.success && data.clients) {
          const normalized = data.clients.map((c: any) => {
            const lockExpiresAt = c.exclusiveLockExpiresAt ? new Date(c.exclusiveLockExpiresAt) : null;
            const daysLeft = lockExpiresAt 
              ? Math.max(0, Math.ceil((lockExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
              : 30;

            const sourceMatch = c.notes?.match(/^\[Source:\s*([^\]]+)\]/);
            const leadSource = sourceMatch 
              ? sourceMatch[1] 
              : (c.notes?.includes("[Website Inquiry") ? "Website Portal" : "Portal / Inbound");
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
    loadClients();
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
    leadSource: "WhatsApp Direct",
    assignedAgent: "Tembo Mwape",
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

    const agentMap: Record<string, string> = {
      "Tembo Mwape": "usr_field_agent",
      "Chipo Banda": "usr_closing_agent",
      "Grace Banda": "user_demo_superadmin",
    };
    const assignedAgentId = agentMap[formData.assignedAgent] || "usr_field_agent";

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
      assignedAgentId,
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
          const leadSource = sourceMatch ? sourceMatch[1] : formData.leadSource;
          const cleanNotes = data.client.notes?.replace(/^\[Source:\s*[^\]]+\]\s*/, "") || data.client.notes || "";

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
            assignedAgent: formData.assignedAgent,
            lockExpiresInDays: 30,
            lastContacted: "Just now",
            status: data.client.status,
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
            leadSource: "WhatsApp Direct",
            assignedAgent: "Tembo Mwape",
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
    <div className="p-6 sm:p-8 pb-32 sm:pb-40 space-y-6 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
            Client Inquiries & CRM
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
            Client Inquiries & CRM
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Buyer and tenant profiles protected by the 30-day anti-poaching lock per closing agent.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold transition-transform active:scale-95 shadow-subtle flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Client Inquiry</span>
        </button>
      </div>

      {/* 30-Day Anti-Poaching Rule Notice */}
      <div className="bg-paper-200 border border-border p-4 rounded-2xl flex items-start gap-3">
        <Lock className="w-5 h-5 text-contour-red shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-ink-800">
          <span className="font-bold text-ink-900">30-Day Anti-Poaching Client Custody Rule</span>
          <p className="text-ink-600 leading-relaxed">
            When an agent logs a client inquiry, the client is exclusively locked to that agent for 30 days. No other agent in the agency may claim closing commission on this buyer without explicit manager sign-off.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-paper-100 px-3 py-2 rounded-xl border border-border flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-600 shrink-0" />
          <input
            type="text"
            placeholder="Search by client name, requirements, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-ink-900 placeholder:text-ink-600 focus:outline-none"
          />
        </div>
        <span className="text-xs font-semibold text-ink-600">
          {filteredClients.length} Registered Buyers / Tenants
        </span>
      </div>

      {/* Clients Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-border shadow-card">
          <Bot className="animate-spin w-8 h-8 mb-2 text-contour-red" />
          <span className="text-xs text-ink-600 font-medium">Loading CRM inquiries...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-border shadow-card text-center space-y-3">
          <Users className="w-12 h-12 text-ink-400" />
          <h3 className="font-semibold text-ink-900">No client inquiries found</h3>
          <p className="text-sm text-ink-600 max-w-sm">No prospective buyers or tenants match your query or have been registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-5 border border-border shadow-card hover:shadow-floating transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-ink-900">{client.name}</h3>
                    <div className="text-[11px] text-ink-600 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">{client.phone}</span>
                      <span>•</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-paper-200 text-ink-800">
                        {client.purpose}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-paper-200 text-ink-800 uppercase tracking-wider">
                    {client.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-paper-100 space-y-1.5 text-xs text-ink-800">
                  <div>
                    <span className="text-[10px] text-ink-600 font-semibold block uppercase tracking-wider">
                      Looking For:
                    </span>
                    <div className="font-medium text-ink-900">{client.lookingFor}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-paper-200">
                    <span className="text-[10px] text-ink-600">Budget:</span>
                    <span className="font-mono font-bold text-ink-900">{client.budgetMax}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-600">Lead Source:</span>
                    <span className="font-medium text-contour-red">{client.leadSource}</span>
                  </div>
                </div>
              </div>

              {/* Anti-Poaching Lock Tag & Agent */}
              <div className="pt-3 border-t border-paper-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-ink-600 block">
                    Assigned: <strong>{client.assignedAgent}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-contour-emerald flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Locked: {client.lockExpiresInDays} days left
                  </span>
                </div>

                <a
                  href={`https://wa.me/${client.phone.replace(/\+/g, "").replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white font-semibold text-[11px] transition-transform active:scale-95 shadow-subtle flex items-center gap-1"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Modal: Add New Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-border shadow-floating space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-contour-red" />
                <h3 className="font-bold text-base text-ink-900">Register Client Inquiry</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-600 hover:text-ink-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-contour-red text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kondwani Phiri"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. +260 97 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. k.phiri@outlook.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1">Property Requirements *</label>
                <input
                  type="text"
                  placeholder="e.g. 4-Bedroom House with Swimming Pool in Kabulonga"
                  value={formData.lookingFor}
                  onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                  className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Budget Max</label>
                  <input
                    type="text"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                  >
                    <option value="BUY">Buy</option>
                    <option value="RENT">Rent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                  >
                    <option value="WhatsApp Direct">WhatsApp Direct</option>
                    <option value="Instagram Ads">Instagram Ads</option>
                    <option value="Client Referral">Client Referral</option>
                    <option value="Facebook Marketplace">Facebook Marketplace</option>
                    <option value="Website Ingest">Website Ingest</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Assigned Agent (30d Lock)</label>
                  <select
                    value={formData.assignedAgent}
                    onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                  >
                    <option value="Tembo Mwape">Tembo Mwape</option>
                    <option value="Chipo Banda">Chipo Banda</option>
                    <option value="Grace Banda">Grace Banda</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-ink-800 hover:bg-paper-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-ink-900 hover:bg-ink-950 text-white font-semibold shadow-subtle flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-contour-red" />
                  <span>Register & Lock Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
