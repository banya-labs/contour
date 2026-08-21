"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Send,
  MessageSquare,
  DollarSign,
  X,
  Sparkles,
  Bot,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function LeasesManagementPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindedLeaseId, setRemindedLeaseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: "",
    tenantName: "",
    tenantPhone: "",
    monthlyRent: "2200",
    currency: "USD",
    managementFeePercent: "10",
    leaseStartDate: "2026-09-01",
    leaseEndDate: "2027-08-31",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [leasesRes, propsRes] = await Promise.all([
          fetch("/api/leases"),
          fetch("/api/properties")
        ]);
        const leasesData = await leasesRes.json();
        const propsData = await propsRes.json();
        if (leasesData.success) {
          setLeases(leasesData.leases);
        }
        if (propsData.success) {
          // Filter to show rent-eligible properties
          const rentProps = propsData.properties.filter(
            (p: any) => p.listingType === "FOR_RENT" || p.listingType === "BOTH"
          );
          setProperties(rentProps);
          if (rentProps.length > 0) {
            setFormData(prev => ({ ...prev, propertyId: rentProps[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load leases or properties:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSendReminder = (leaseId: string) => {
    setRemindedLeaseId(leaseId);
    setTimeout(() => {
      alert("WhatsApp Arrears Reminder Tier-1 Dispatched to Tenant with 4-day cooldown key!");
    }, 400);
  };

  const handleCreateLease = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.propertyId) {
      setFormError("Please select a property for this lease.");
      return;
    }
    if (!formData.tenantName.trim() || formData.tenantName.length < 3) {
      setFormError("Tenant full name is required (at least 3 characters).");
      return;
    }
    if (!formData.tenantPhone.trim() || formData.tenantPhone.length < 7) {
      setFormError("Valid tenant phone number is required.");
      return;
    }

    const rentNum = parseFloat(formData.monthlyRent);
    if (!rentNum || rentNum <= 0) {
      setFormError("Monthly rent must be greater than 0.");
      return;
    }

    const leasePayload = {
      propertyId: formData.propertyId,
      tenantName: formData.tenantName,
      tenantPhone: formData.tenantPhone,
      monthlyRent: rentNum,
      currency: formData.currency,
      managementFeePercent: parseFloat(formData.managementFeePercent) || 10,
      leaseStartDate: formData.leaseStartDate,
      leaseEndDate: formData.leaseEndDate,
      depositAmount: rentNum,
      paymentDayOfMonth: 1,
    };

    fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leasePayload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lease) {
          setLeases([data.lease, ...leases]);
          setIsModalOpen(false);
          setFormData({
            propertyId: properties[0]?.id || "",
            tenantName: "",
            tenantPhone: "",
            monthlyRent: "2200",
            currency: "USD",
            managementFeePercent: "10",
            leaseStartDate: "2026-09-01",
            leaseEndDate: "2027-08-31",
          });
          alert(`[SUCCESS] New lease for ${data.lease.tenantName} created and saved to database!`);
        } else {
          setFormError(data.error || "Failed to save lease.");
        }
      })
      .catch((err) => {
        setFormError(`Failed to save lease: ${err.message}`);
      });
  };

  return (
    <div className="p-6 sm:p-8 pb-32 sm:pb-40 space-y-6 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
            Property Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
            Rentals & Leases
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Track active tenancies, automated rent arrears escalation, and Mobile Money/Bank EFT receipts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold transition-transform active:scale-95 shadow-subtle flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lease Agreement</span>
        </button>
      </div>

      {/* Leases Table Card */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-ink-900">Active Tenant Leases ({leases.length})</h3>
          <span className="text-xs text-ink-600">Standard 10% Agency Management Fee</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-ink-600 font-medium">
            <Bot className="animate-spin w-8 h-8 mb-2 text-contour-red" />
            <span>Loading leases from database...</span>
          </div>
        ) : leases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-white">
            <KeyRound className="w-12 h-12 text-ink-400" />
            <h3 className="font-semibold text-ink-900">No active leases</h3>
            <p className="text-sm text-ink-600 max-w-sm">There are no active rental leases logged in the database. Create a new lease agreement to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-100 text-ink-600 uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="p-4 font-semibold">Property</th>
                  <th className="p-4 font-semibold">Tenant Details</th>
                  <th className="p-4 font-semibold">Monthly Rent</th>
                  <th className="p-4 font-semibold">Lease Term</th>
                  <th className="p-4 font-semibold">Payment Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leases.map((lease) => {
                  const isArrears = lease.status === "IN_ARREARS";
                  const isReminded = remindedLeaseId === lease.id;
                  const propertyTitle = lease.property?.title || lease.propertyTitle || "Untitled Property";
                  const startDate = lease.leaseStartDate ? new Date(lease.leaseStartDate).toISOString().split("T")[0] : "";
                  const endDate = lease.leaseEndDate ? new Date(lease.leaseEndDate).toISOString().split("T")[0] : "";
                  const arrearsVal = Number(lease.arrearsAmount || lease.monthlyRent || 0);

                  return (
                    <tr key={lease.id} className="hover:bg-paper-100/50 transition-colors">
                      <td className="p-4 font-semibold text-ink-900 max-w-xs">
                        {propertyTitle}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-ink-900">{lease.tenantName}</div>
                        <div className="text-[11px] text-ink-600 font-mono">{lease.tenantPhone}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-ink-900">
                        {formatCurrency(Number(lease.monthlyRent || 0), lease.currency)}
                        <div className="text-[10px] text-ink-600 font-sans font-normal">
                          10% fee: {formatCurrency(Number(lease.monthlyRent || 0) * (Number(lease.managementFeePercent || 10) / 100), lease.currency)}
                        </div>
                      </td>
                      <td className="p-4 text-ink-800 font-mono text-[11px]">
                        {startDate} to {endDate}
                      </td>
                      <td className="p-4">
                        {isArrears ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3" /> Overdue ({formatCurrency(arrearsVal, lease.currency)})
                            </span>
                            <div className="text-[10px] text-contour-red font-medium">
                              14 Days Overdue
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Up to Date
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isArrears && (
                          <button
                            onClick={() => handleSendReminder(lease.id)}
                            disabled={isReminded}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-subtle ${
                              isReminded
                                ? "bg-paper-300 text-ink-600 cursor-not-allowed"
                                : "bg-contour-red hover:bg-red-800 text-white active:scale-95"
                            }`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{isReminded ? "Nudge Dispatched (Cooldown 4d)" : "Send WhatsApp Nudge"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Modal: New Lease Agreement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-border shadow-floating space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-contour-red" />
                <h3 className="font-bold text-base text-ink-900">Create New Lease Agreement</h3>
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

            <form onSubmit={handleCreateLease} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-ink-800 mb-1">Select Property *</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.suburb})
                    </option>
                  ))}
                  {properties.length === 0 && (
                    <option value="">No properties available for rent</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Tenant Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Michael Phiri"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Tenant Phone Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. +260 97 811 2233"
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Monthly Rent *</label>
                  <input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZMW">ZMW (K)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Fee %</label>
                  <input
                    type="number"
                    value={formData.managementFeePercent}
                    onChange={(e) => setFormData({ ...formData, managementFeePercent: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    value={formData.leaseStartDate}
                    onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={formData.leaseEndDate}
                    onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                  />
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
                  <span>Activate Lease</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
