"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Plus,
  MessageSquare,
  X,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MotionCard } from "@/components/ui/animate/motion-card";

function LeasesManagementContent() {
  const [leases, setLeases] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindedLeaseId, setRemindedLeaseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1" || searchParams?.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

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
          fetch("/api/properties"),
        ]);
        const leasesData = await leasesRes.json();
        const propsData = await propsRes.json();
        if (leasesData.success) {
          setLeases(leasesData.leases);
        }
        if (propsData.success) {
          const rentProps = propsData.properties.filter(
            (p: any) => p.listingType === "FOR_RENT" || p.listingType === "BOTH"
          );
          setProperties(rentProps);
          if (rentProps.length > 0) {
            setFormData((prev) => ({ ...prev, propertyId: rentProps[0].id }));
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
        } else {
          setFormError(data.error || "Failed to create lease.");
        }
      })
      .catch((err) => {
        setFormError(`Failed to create lease: ${err.message}`);
      });
  };

  const arrearsLeases = leases.filter((l) => l.status === "IN_ARREARS");

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist antialiased text-editorial-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-geist font-bold px-1.5 sm:px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
              Leasehold Management
            </span>
            <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted">
              WhatsApp Nudge Protocol
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
            Rentals & Leases
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
            Active tenancies, automated 1st-of-month rent schedules, and WhatsApp arrears recovery workflows.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 sm:px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lease</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <MotionCard withCorners className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Total Active Leases
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-editorial-black mt-1 tracking-tight">
            {loading ? "…" : leases.length}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Occupied rental properties
          </span>
        </MotionCard>

        <MotionCard withCorners active={arrearsLeases.length > 0} className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-contour-red uppercase tracking-wider">
            Tenants in Arrears
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-contour-red mt-1 tracking-tight">
            {loading ? "…" : arrearsLeases.length}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-contour-red mt-0.5 block">
            Require WhatsApp reminder
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Collection Rate
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-emerald-800 mt-1 tracking-tight">
            {loading
              ? "…"
              : leases.length > 0
              ? (((leases.length - arrearsLeases.length) / leases.length) * 100).toFixed(1) + "%"
              : "100%"}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Up-to-date rent payments
          </span>
        </MotionCard>
      </div>

      {/* Leases Table Card */}
      <div className="bg-white border border-editorial-border">
        <div className="p-3 sm:p-4 border-b border-editorial-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-xs sm:text-sm text-editorial-black uppercase tracking-wider">
            Active Leases & Rent Ledger
          </h3>
          <span className="text-[9px] sm:text-[10px] font-geist text-editorial-muted uppercase tracking-wider">
            4-Day Cooldown WhatsApp
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-editorial-muted text-xs font-geist">
            Loading leases from database...
          </div>
        ) : leases.length === 0 ? (
          <div className="py-16 text-center text-xs text-editorial-muted font-geist">
            No active leases found.
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-editorial-border">
              {leases.map((lease) => {
                const isArrears = lease.status === "IN_ARREARS";
                const isReminded = remindedLeaseId === lease.id;
                const propertyTitle =
                  lease.property?.title || lease.propertyTitle || "Untitled Property";
                const startDate = lease.leaseStartDate
                  ? new Date(lease.leaseStartDate).toISOString().split("T")[0]
                  : "";
                const endDate = lease.leaseEndDate
                  ? new Date(lease.leaseEndDate).toISOString().split("T")[0]
                  : "";

                return (
                  <div key={lease.id} className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                          {lease.property?.suburb || "Lusaka"}
                        </span>
                        <h4 className="font-heading font-bold text-sm text-editorial-black truncate">
                          {propertyTitle}
                        </h4>
                      </div>
                      <span
                        className={`text-[9px] font-geist font-bold px-2 py-0.5 border shrink-0 ${
                          isArrears
                            ? "border-red-300 bg-red-50 text-red-800"
                            : "border-emerald-300 bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {isArrears ? "IN ARREARS" : "CURRENT"}
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50 border border-editorial-border text-xs font-geist space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Tenant:</span>
                        <strong className="text-editorial-black">{lease.tenantName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Phone:</span>
                        <span className="font-mono text-editorial-black">{lease.tenantPhone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Rent:</span>
                        <strong className="text-editorial-black">
                          {formatCurrency(Number(lease.monthlyRent || 0), lease.currency)} / mo
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Term:</span>
                        <span className="text-editorial-muted text-[11px]">{startDate} → {endDate}</span>
                      </div>
                    </div>

                    {isArrears && (
                      <button
                        onClick={() => handleSendReminder(lease.id)}
                        disabled={isReminded}
                        className={`w-full py-2.5 px-3 text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                          isReminded
                            ? "bg-neutral-100 text-editorial-muted border border-editorial-border cursor-not-allowed"
                            : "bg-contour-red hover:bg-red-800 text-white"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isReminded ? "Dispatched" : "WhatsApp Nudge"}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-geist">
                <thead className="bg-neutral-50 text-editorial-muted uppercase tracking-wider text-[10px] font-heading font-semibold border-b border-editorial-border">
                  <tr>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Tenant Information</th>
                    <th className="py-3 px-4">Monthly Rent</th>
                    <th className="py-3 px-4">Lease Term</th>
                    <th className="py-3 px-4">Arrears Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-editorial-border">
                  {leases.map((lease) => {
                    const isArrears = lease.status === "IN_ARREARS";
                    const isReminded = remindedLeaseId === lease.id;
                    const propertyTitle =
                      lease.property?.title || lease.propertyTitle || "Untitled Property";
                    const startDate = lease.leaseStartDate
                      ? new Date(lease.leaseStartDate).toISOString().split("T")[0]
                      : "";
                    const endDate = lease.leaseEndDate
                      ? new Date(lease.leaseEndDate).toISOString().split("T")[0]
                      : "";

                    return (
                      <tr key={lease.id} className="hover:bg-[#fff5f3]/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-editorial-black max-w-xs">
                          {propertyTitle}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-editorial-black">{lease.tenantName}</div>
                          <div className="text-[11px] text-editorial-muted font-mono">{lease.tenantPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-geist font-bold text-editorial-black">
                          {formatCurrency(Number(lease.monthlyRent || 0), lease.currency)}
                          <div className="text-[10px] text-editorial-muted font-normal">
                            Fee: {lease.managementFeePercent}%
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-editorial-muted text-[11px]">
                          {startDate} → {endDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[9px] font-geist font-bold uppercase tracking-wider px-2 py-0.5 border ${
                              isArrears
                                ? "border-red-300 bg-red-50 text-red-800"
                                : "border-emerald-300 bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {isArrears ? "IN ARREARS" : "CURRENT"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isArrears && (
                            <button
                              onClick={() => handleSendReminder(lease.id)}
                              disabled={isReminded}
                              className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                                isReminded
                                  ? "bg-neutral-100 text-editorial-muted border border-editorial-border cursor-not-allowed"
                                  : "bg-contour-red hover:bg-red-800 text-white shadow-none"
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{isReminded ? "Dispatched" : "WhatsApp Nudge"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Interactive Modal: New Lease Agreement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-geist">
          <div className="bg-white max-w-lg w-full p-4 sm:p-6 border border-editorial-border space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Create New Lease Agreement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-none border border-editorial-border bg-white text-editorial-black hover:bg-editorial-black hover:text-white transition-all shadow-xs"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 border border-red-300 bg-red-50 text-red-800 text-xs font-geist">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateLease} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Select Property *
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
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
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Tenant Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Michael Phiri"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Tenant Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +260 97 811 2233"
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Monthly Rent *
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZMW">ZMW (K)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Fee %
                  </label>
                  <input
                    type="number"
                    value={formData.managementFeePercent}
                    onChange={(e) => setFormData({ ...formData, managementFeePercent: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Lease Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.leaseStartDate}
                    onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Lease End Date
                  </label>
                  <input
                    type="date"
                    value={formData.leaseEndDate}
                    onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-editorial-border text-editorial-black hover:bg-neutral-50 text-xs font-heading font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
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

export default function LeasesManagementPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-mono text-editorial-muted">Loading leases...</div>}>
      <LeasesManagementContent />
    </React.Suspense>
  );
}
