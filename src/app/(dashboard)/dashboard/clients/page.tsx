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
  Edit3,
  Trash2,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { MotionCard } from "@/components/ui/animate/motion-card";
import { useSession } from "@/lib/auth-client";
import { formatWhatsAppDigits } from "@/lib/phone-utils";

function ClientsCRMContent() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; roleKey?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAssigned, setFilterAssigned] = useState<"ALL" | "ASSIGNED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit Client State
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    email: "",
    lookingFor: "",
    preferredSuburbs: "",
    budgetMax: "",
    currency: "ZMW" as "ZMW" | "USD",
    purpose: "BUY" as "BUY" | "RENT",
    leadSource: "WALK_IN",
    assignedAgentId: "",
    status: "NEW_INQUIRY",
  });
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Client State
  const [deletingClient, setDeletingClient] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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
              rawBudgetMax: c.budgetMax ? Number(c.budgetMax) : null,
              currency: c.currency || "ZMW",
              purpose: c.lookingFor === "FOR_RENT" ? "RENT" : "BUY",
              leadSource,
              assignedAgentId: c.assignedAgentId || c.assignedAgent?.id || "",
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

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setEditError("");
    setEditFormData({
      name: client.name || "",
      phone: client.phone || "",
      email: client.email && client.email !== "not-provided@client.zm" ? client.email : "",
      lookingFor: client.lookingFor || "",
      preferredSuburbs: Array.isArray(client.preferredSuburbs) ? client.preferredSuburbs.join(", ") : "",
      budgetMax: client.rawBudgetMax ? client.rawBudgetMax.toString() : "",
      currency: client.currency || "ZMW",
      purpose: client.purpose || "BUY",
      leadSource: client.leadSource || "WALK_IN",
      assignedAgentId: client.assignedAgentId || "",
      status: client.status || "NEW_INQUIRY",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setEditError("");

    if (!editFormData.name.trim() || editFormData.name.length < 2) {
      setEditError("Client name is required (at least 2 characters).");
      return;
    }
    if (!editFormData.phone.trim() || editFormData.phone.length < 6) {
      setEditError("Valid phone number is required.");
      return;
    }

    const budgetStr = editFormData.budgetMax.replace(/[^0-9.]/g, "");
    const budgetNum = parseFloat(budgetStr) || undefined;
    const lookingForType = editFormData.purpose === "RENT" ? "FOR_RENT" : "FOR_SALE";

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: editFormData.name.trim(),
          clientPhone: editFormData.phone.trim(),
          clientEmail: editFormData.email.trim() || null,
          lookingFor: lookingForType,
          budgetMax: budgetNum,
          currency: editFormData.currency,
          preferredSuburbs: editFormData.preferredSuburbs
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          notes: `[Source: ${editFormData.leadSource}] ${editFormData.lookingFor.trim()}`,
          leadSource: editFormData.leadSource,
          assignedAgentId: editFormData.assignedAgentId || null,
          status: editFormData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditError(data.error || "Failed to update client details.");
        setIsSavingEdit(false);
        return;
      }

      const updatedInquiry = data.inquiry;
      const assignedAgentObj = agents.find((a) => a.id === editFormData.assignedAgentId);
      const assignedName = updatedInquiry?.assignedAgent?.name || assignedAgentObj?.name || (editFormData.assignedAgentId ? "Assigned Agent" : "Unassigned");

      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== editingClient.id) return c;
          return {
            ...c,
            name: editFormData.name.trim(),
            phone: editFormData.phone.trim(),
            email: editFormData.email.trim() || "not-provided@client.zm",
            lookingFor: editFormData.lookingFor.trim(),
            preferredSuburbs: editFormData.preferredSuburbs
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            budgetMax: budgetNum
              ? `${editFormData.currency === "USD" ? "$" : "K"} ${Number(budgetNum).toLocaleString()}`
              : "No budget limit",
            rawBudgetMax: budgetNum || null,
            currency: editFormData.currency,
            purpose: editFormData.purpose,
            leadSource: editFormData.leadSource,
            assignedAgentId: editFormData.assignedAgentId || "",
            assignedAgent: assignedName,
            lockExpiresInDays: editFormData.assignedAgentId ? 30 : c.lockExpiresInDays,
            status: editFormData.status,
          };
        })
      );

      setEditingClient(null);
    } catch (err: any) {
      setEditError(`Failed to update client: ${err?.message || "Network error"}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    setDeleteError("");
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clients/${deletingClient.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Failed to delete client.");
        setIsDeleting(false);
        return;
      }

      setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
      setDeletingClient(null);
    } catch (err: any) {
      setDeleteError(`Failed to delete client: ${err?.message || "Network error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      search.trim() === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lookingFor.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);

    const matchesAssigned =
      filterAssigned === "ALL" ||
      (session?.user?.id && (c.assignedAgentId === session.user.id || c.assignedAgent === session.user.name));

    return matchesSearch && matchesAssigned;
  });

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

      {/* Search Bar & Filter */}
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

        <div className="flex items-center gap-3">
          <select
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value as "ALL" | "ASSIGNED")}
            className="bg-white text-xs font-mono font-semibold uppercase tracking-wider text-editorial-black px-3 py-2 border border-editorial-border focus:outline-none"
          >
            <option value="ALL">All Agents</option>
            <option value="ASSIGNED">Assigned to Me</option>
          </select>
          <span className="text-xs font-mono font-semibold text-editorial-neutral whitespace-nowrap">
            {filteredClients.length} REGISTERED BUYERS / TENANTS
          </span>
        </div>
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
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-editorial-paper border border-editorial-border text-editorial-black uppercase tracking-wider">
                      {client.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        className="p-1 border border-editorial-border hover:border-editorial-black bg-white hover:bg-neutral-100 text-editorial-black transition-colors"
                        title="Edit Client & Reassign Manager"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingClient(client)}
                        className="p-1 border border-editorial-border hover:border-red-600 bg-white hover:bg-red-50 text-editorial-neutral hover:text-red-600 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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

              {/* Anti-Poaching Lock Tag & Custody Manager */}
              <div className="pt-3 border-t border-editorial-border flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-editorial-neutral block">
                      Manager: <strong className="text-editorial-black">{client.assignedAgent}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditModal(client)}
                      className="text-[9px] font-mono font-bold text-editorial-red hover:underline"
                      title="Change who this client is assigned to as manager"
                    >
                      [Change]
                    </button>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Locked: {client.lockExpiresInDays}d left
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(client)}
                    className="px-2.5 py-1.5 rounded-none border border-editorial-border hover:border-editorial-black bg-white hover:bg-neutral-50 text-editorial-black font-mono font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1"
                    title="Edit client details"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <a
                    href={`https://wa.me/${formatWhatsAppDigits(client.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-none bg-editorial-black hover:bg-black text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </MotionCard>
          ))}
        </div>
      )}

      {/* Interactive Modal: Add New Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-none max-w-lg w-full p-4 sm:p-6 border border-editorial-black space-y-4 max-h-[90dvh] overflow-y-auto font-geist">
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

      {/* Interactive Modal: Edit Client Details & Reassign Manager */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-none max-w-lg w-full p-4 sm:p-6 border border-editorial-black space-y-4 max-h-[90dvh] overflow-y-auto font-geist">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-editorial-black" />
                <h3 className="font-serif font-bold text-lg text-editorial-black">
                  Edit Client Details & Custody
                </h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-editorial-neutral hover:text-editorial-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 text-editorial-red text-xs font-mono font-semibold border border-red-200">
                [ERROR] {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black"
                  placeholder="e.g. client@domain.com"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                  Property Requirements (Looking For) *
                </label>
                <input
                  type="text"
                  value={editFormData.lookingFor}
                  onChange={(e) => setEditFormData({ ...editFormData, lookingFor: e.target.value })}
                  className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Budget Max
                  </label>
                  <input
                    type="number"
                    value={editFormData.budgetMax}
                    onChange={(e) => setEditFormData({ ...editFormData, budgetMax: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono"
                    placeholder="e.g. 2500000"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <select
                    value={editFormData.currency}
                    onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value as "ZMW" | "USD" })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Purpose
                  </label>
                  <select
                    value={editFormData.purpose}
                    onChange={(e) => setEditFormData({ ...editFormData, purpose: e.target.value as "BUY" | "RENT" })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
                  >
                    <option value="BUY">Buy</option>
                    <option value="RENT">Rent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Pipeline Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
                  >
                    <option value="NEW_INQUIRY">New Inquiry</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="VIEWING_SCHEDULED">Viewing Scheduled</option>
                    <option value="NEGOTIATING">Negotiating</option>
                    <option value="OFFER_MADE">Offer Made</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Preferred Suburbs
                  </label>
                  <input
                    type="text"
                    value={editFormData.preferredSuburbs}
                    onChange={(e) => setEditFormData({ ...editFormData, preferredSuburbs: e.target.value })}
                    className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black"
                    placeholder="e.g. Kabulonga, Woodlands"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider mb-1">
                    Lead Source
                  </label>
                  <select
                    value={editFormData.leadSource}
                    onChange={(e) => setEditFormData({ ...editFormData, leadSource: e.target.value })}
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
              </div>

              {/* Assigned Manager / Custody Agent */}
              <div className="p-3 bg-editorial-paper border border-editorial-border space-y-1.5">
                <label className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-editorial-red" />
                    <span>Assigned Manager / Agent (30d Custody Lock)</span>
                  </span>
                </label>
                <select
                  value={editFormData.assignedAgentId}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedAgentId: e.target.value })}
                  className="w-full bg-white px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
                >
                  <option value="">Unassigned (No Custody Lock)</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] font-mono text-editorial-neutral">
                  Selecting a manager updates who controls this client inquiry and refreshes the 30-day anti-poaching lock.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-none border border-editorial-border text-editorial-black hover:bg-editorial-paper font-mono text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-none bg-editorial-black hover:bg-black disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  {isSavingEdit ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save Client Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Modal: Delete Client Confirmation */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-none max-w-md w-full p-5 sm:p-6 border border-red-600 space-y-4 font-geist">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h3 className="font-serif font-bold text-lg text-editorial-black">
                  Delete Client Record
                </h3>
              </div>
              <button
                onClick={() => setDeletingClient(null)}
                className="text-editorial-neutral hover:text-editorial-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-mono font-semibold border border-red-200">
                [ERROR] {deleteError}
              </div>
            )}

            <div className="p-3 bg-red-50/50 border border-red-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-editorial-neutral uppercase text-[10px]">Client:</span>
                <strong className="text-editorial-black font-semibold">{deletingClient.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-editorial-neutral uppercase text-[10px]">Phone:</span>
                <span className="font-mono text-editorial-black">{deletingClient.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-editorial-neutral uppercase text-[10px]">Assigned Manager:</span>
                <span className="text-editorial-black font-medium">{deletingClient.assignedAgent}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Are you sure you want to permanently delete <strong>{deletingClient.name}</strong>? This will release their 30-day custody lock and remove any scheduled visits. This action cannot be undone.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
                className="px-4 py-2 rounded-none border border-editorial-border text-editorial-black hover:bg-neutral-50 font-mono text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteClient}
                className="px-5 py-2 rounded-none bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
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
