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
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { SelectedRowDetailsDialog } from "@/components/ui/selected-row-details-dialog";
import { mutationTouchesScope, WORKSPACE_MUTATION_EVENT, type WorkspaceMutationEventDetail } from "@/lib/workspace-events";
import { PageTabs } from "@/components/ui/page-tabs";

function LeasesManagementContent() {
  const [leases, setLeases] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindedLeaseId, setRemindedLeaseId] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingLease, setIsCreatingLease] = useState(false);
  const [selectedLease, setSelectedLease] = useState<any | null>(null);
  const [leaseAction, setLeaseAction] = useState<"TERMINATE" | "RELIST" | null>(null);
  const [leaseActionReason, setLeaseActionReason] = useState("");
  const [leaseActionError, setLeaseActionError] = useState("");
  const [isSubmittingLeaseAction, setIsSubmittingLeaseAction] = useState(false);
  const [statementMonth, setStatementMonth] = useState(new Date().getMonth() + 1);
  const [statementYear, setStatementYear] = useState(new Date().getFullYear());
  const [statementError, setStatementError] = useState("");
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1" || searchParams?.get("new") === "true") {
      setIsModalOpen(true);
    }
    const rawPrefill = searchParams?.get("prefill");
    if (rawPrefill) {
      try {
        const prefill = JSON.parse(rawPrefill) as { propertyId?: string; inquiryId?: string; tenantName?: string; tenantPhone?: string; tenantEmail?: string; monthlyRent?: number; currency?: string };
        setFormData((prev) => ({
          ...prev,
          propertyId: prefill.propertyId || prev.propertyId,
          inquiryId: prefill.inquiryId || prev.inquiryId,
          tenantName: prefill.tenantName || prev.tenantName,
          tenantPhone: prefill.tenantPhone || prev.tenantPhone,
          monthlyRent: prefill.monthlyRent ? String(prefill.monthlyRent) : prev.monthlyRent,
          currency: prefill.currency || prev.currency,
        }));
      } catch {
        setFormError("The rental deal could not be prefilled. Please complete the lease manually.");
      }
    }
  }, [searchParams]);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: "",
    inquiryId: "",
    tenantName: "",
    tenantPhone: "",
    monthlyRent: "",
    depositAmount: "",
    paymentDayOfMonth: "",
    currency: "ZMW",
    managementFeePercent: "",
    leaseStartDate: "",
    leaseEndDate: "",
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
          const leaseId = searchParams?.get("leaseId");
          if (leaseId) {
            const matchingLease = leasesData.leases.find((lease: any) => lease.id === leaseId);
            if (matchingLease) setSelectedLease(matchingLease);
          }
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
  }, [refreshNonce]);
  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceMutationEventDetail>).detail;
      if (detail && mutationTouchesScope(detail, "leases")) setRefreshNonce((value) => value + 1);
    };
    window.addEventListener(WORKSPACE_MUTATION_EVENT, handle);
    return () => window.removeEventListener(WORKSPACE_MUTATION_EVENT, handle);
  }, []);

  const handleSendReminder = async (leaseId: string) => {
    setRemindedLeaseId(leaseId);
    setReminderError("");
    try {
      const response = await fetch(`/api/leases/${leaseId}/arrears-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: 1 }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Unable to queue reminder.");
      setRefreshNonce((value) => value + 1);
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : "Unable to queue reminder.");
    } finally {
      setRemindedLeaseId(null);
    }
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

    if (!formData.leaseStartDate || !formData.leaseEndDate || formData.leaseEndDate <= formData.leaseStartDate) {
      setFormError("Lease start and end dates are required, and the end date must be later.");
      return;
    }

    const rentNum = parseFloat(formData.monthlyRent);
    if (!rentNum || rentNum <= 0) {
      setFormError("Monthly rent must be greater than 0.");
      return;
    }
    const depositNum = parseFloat(formData.depositAmount);
    const paymentDay = Number(formData.paymentDayOfMonth);
    if (!Number.isFinite(depositNum) || depositNum < 0) {
      setFormError("Deposit amount is required and cannot be negative.");
      return;
    }
    if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 28) {
      setFormError("Payment day must be a whole number from 1 to 28.");
      return;
    }
    const feePercent = parseFloat(formData.managementFeePercent);
    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
      setFormError("Management fee must be entered as a percentage from 0 to 100.");
      return;
    }

    const leasePayload = {
      propertyId: formData.propertyId,
      inquiryId: formData.inquiryId || undefined,
      tenantName: formData.tenantName,
      tenantPhone: formData.tenantPhone,
      monthlyRent: rentNum,
      currency: formData.currency,
      managementFeePercent: feePercent,
      leaseStartDate: formData.leaseStartDate,
      leaseEndDate: formData.leaseEndDate,
      depositAmount: depositNum,
      paymentDayOfMonth: paymentDay,
    };

    setIsCreatingLease(true);
    fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leasePayload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lease) {
          window.dispatchEvent(new CustomEvent(WORKSPACE_MUTATION_EVENT, { detail: { scopes: ["leases", "properties", "dashboard"], entityId: data.lease.id } }));
          setLeases([data.lease, ...leases]);
          setIsModalOpen(false);
          setFormData({
            propertyId: properties[0]?.id || "",
            inquiryId: "",
            tenantName: "",
            tenantPhone: "",
            monthlyRent: "",
            depositAmount: "",
            paymentDayOfMonth: "",
            currency: "ZMW",
            managementFeePercent: "",
            leaseStartDate: "",
            leaseEndDate: "",
          });
        } else {
          setFormError(data.error || "Failed to create lease.");
        }
      })
      .catch((err) => {
        setFormError(`Failed to create lease: ${err.message}`);
      })
      .finally(() => {
        setIsCreatingLease(false);
      });
  };

  const arrearsLeases = leases.filter((l) => l.status === "IN_ARREARS");

  const submitLeaseAction = async () => {
    if (!selectedLease || !leaseAction) return;
    if (leaseAction === "TERMINATE" && !leaseActionReason.trim()) { setLeaseActionError("A reason is required to cancel this lease."); return; }
    setIsSubmittingLeaseAction(true); setLeaseActionError("");
    try {
      const response = await fetch(`/api/leases/${selectedLease.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: leaseAction, reason: leaseActionReason.trim() || undefined }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to update the lease.");
      setSelectedLease(null); setLeaseAction(null); setLeaseActionReason(""); setRefreshNonce((value) => value + 1);
      window.dispatchEvent(new CustomEvent(WORKSPACE_MUTATION_EVENT, { detail: { scopes: ["leases", "properties", "dashboard"], entityId: selectedLease.id } }));
    } catch (error) { setLeaseActionError(error instanceof Error ? error.message : "Unable to update the lease."); }
    finally { setIsSubmittingLeaseAction(false); }
  };

  const previewStatement = (statement: any) => {
    const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=900");
    if (!popup) { setStatementError("Allow pop-ups to preview or download the statement."); return; }
    const money = (value: unknown) => formatCurrency(Number(value || 0), statement.currency);
    popup.document.write(`<!doctype html><html><head><title>Landlord Statement</title><style>body{font-family:Arial,sans-serif;color:#1c1c1a;margin:0;padding:48px;background:#f3f1ec}main{max-width:780px;margin:auto;background:#fff;padding:48px;border:1px solid #d8d4cc}header{display:flex;justify-content:space-between;border-bottom:2px solid #fa3600;padding-bottom:24px;margin-bottom:28px}img{width:150px}.meta{font-size:12px;color:#666;line-height:1.7}.line{display:flex;justify-content:space-between;border-bottom:1px solid #e5e2dc;padding:12px 0;font-size:14px}.total{font-size:20px;font-weight:bold;color:#087443;border-top:2px solid #087443;margin-top:14px;padding-top:16px}@media print{body{background:#fff;padding:0}main{border:0;padding:24px}}</style></head><body><main><header><div><img src="${window.location.origin}/brand/contour-wordmark.svg" alt="Contour"/><p class="meta">LANDLORD REMITTANCE STATEMENT</p><h1>${statement.property?.title || "Managed property"}</h1></div><div class="meta"><strong>${statement.statementMonth}/${statement.statementYear}</strong><br/>${statement.property?.suburb || ""}<br/>Landlord: ${statement.landlordName || "Landlord"}</div></header><div class="line"><span>Rent due</span><strong>${money(statement.rentDue)}</strong></div><div class="line"><span>Gross rent collected</span><strong>${money(statement.grossRentCollected)}</strong></div><div class="line"><span>Agency fee deducted</span><strong>- ${money(statement.agencyFeeDeducted)}</strong></div><div class="line"><span>Maintenance deducted</span><strong>- ${money(statement.maintenanceDeducted)}</strong></div><div class="line"><span>Closing arrears</span><strong>${money(statement.arrearsClosing)}</strong></div><div class="total">Net landlord payout <span style="float:right">${money(statement.netLandlordPayout)}</span></div><p class="meta" style="margin-top:42px">Generated by Contour from the recorded rent ledger and maintenance expenses.</p><script>window.onload=()=>window.print()</script></main></body></html>`);
    popup.document.close();
  };

  const generateStatement = async () => {
    if (!selectedLease?.propertyId) return;
    setIsGeneratingStatement(true); setStatementError("");
    try {
      const response = await fetch("/api/statements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: selectedLease.propertyId, statementMonth, statementYear, currency: selectedLease.currency || "ZMW" }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to generate statement.");
      previewStatement(data.statement);
    } catch (error) { setStatementError(error instanceof Error ? error.message : "Unable to generate statement."); }
    finally { setIsGeneratingStatement(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist antialiased text-editorial-black">
      {reminderError && (
        <div className="p-2.5 border border-red-300 bg-red-50 text-red-800 text-xs font-geist">{reminderError}</div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-geist font-bold px-1.5 sm:px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
              Leasehold Management
            </span>
            <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted">
              Arrears Reminder Queue
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
            Rentals & Leases
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
            Active tenancies, rent schedules, and auditable arrears reminder workflows.
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
            Require arrears reminder
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

      {/* Rentals workspace tabs */}
      <PageTabs
        tabs={[
          { id: "leases", label: "Leases", href: "/dashboard/leases", count: leases.length },
          { id: "statements", label: "Statements", href: "/dashboard/leases?tab=statements" },
        ]}
        activeTab={activeTab}
        className="mt-1"
      />

      {/* Leases Table Card */}
      <div className="bg-white border border-editorial-border">
        <div className="p-3 sm:p-4 border-b border-editorial-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-xs sm:text-sm text-editorial-black uppercase tracking-wider">
            Active Leases & Rent Ledger
          </h3>
          <span className="text-[9px] sm:text-[10px] font-geist text-editorial-muted uppercase tracking-wider">
              4-Day Reminder Cooldown
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
                        <span>{isReminded ? "Queued" : "Queue reminder"}</span>
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
                      <tr key={lease.id} onClick={() => setSelectedLease(lease)} className="cursor-pointer hover:bg-[#fff5f3]/40 transition-colors" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedLease(lease); }}>
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
                              onClick={(event) => { event.stopPropagation(); void handleSendReminder(lease.id); }}
                              disabled={isReminded}
                              className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                                isReminded
                                  ? "bg-neutral-100 text-editorial-muted border border-editorial-border cursor-not-allowed"
                                  : "bg-contour-red hover:bg-red-800 text-white shadow-none"
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{isReminded ? "Queued" : "Queue reminder"}</span>
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

      <SelectedRowDetailsDialog
        open={Boolean(selectedLease)}
        onClose={() => setSelectedLease(null)}
        eyebrow="Rental lease"
        title={selectedLease?.property?.title || selectedLease?.propertyTitle || "Lease agreement"}
        subtitle={selectedLease ? `${selectedLease.tenantName || "Tenant"} · ${selectedLease.status || "-"}` : undefined}
        details={selectedLease ? [
          { label: "Tenant", value: selectedLease.tenantName },
          { label: "Tenant phone", value: selectedLease.tenantPhone },
          { label: "Tenant email", value: selectedLease.tenantEmail },
          { label: "Monthly rent", value: formatCurrency(Number(selectedLease.monthlyRent || 0), selectedLease.currency) },
          { label: "Deposit", value: formatCurrency(Number(selectedLease.depositAmount || 0), selectedLease.currency) },
          { label: "Management fee", value: `${selectedLease.managementFeePercent || 0}%` },
          { label: "Lease term", value: `${selectedLease.leaseStartDate ? new Date(selectedLease.leaseStartDate).toLocaleDateString() : "-"} → ${selectedLease.leaseEndDate ? new Date(selectedLease.leaseEndDate).toLocaleDateString() : "-"}` },
          { label: "Status", value: selectedLease.status?.replace(/_/g, " ") },
        ] : []}
      >
        {selectedLease && <div className="space-y-4"><div className="border-t border-editorial-border pt-4"><p className="text-[10px] font-heading font-bold uppercase tracking-wider text-editorial-muted mb-2">Landlord statement</p><div className="grid grid-cols-2 gap-2"><select value={statementMonth} onChange={(event) => setStatementMonth(Number(event.target.value))} className="border border-editorial-border px-2 py-2 text-xs"><option value={1}>January</option><option value={2}>February</option><option value={3}>March</option><option value={4}>April</option><option value={5}>May</option><option value={6}>June</option><option value={7}>July</option><option value={8}>August</option><option value={9}>September</option><option value={10}>October</option><option value={11}>November</option><option value={12}>December</option></select><input type="number" value={statementYear} onChange={(event) => setStatementYear(Number(event.target.value))} className="border border-editorial-border px-2 py-2 text-xs" /></div>{statementError && <p className="mt-2 border border-red-200 bg-red-50 p-2 text-xs text-red-800">{statementError}</p>}<button type="button" disabled={isGeneratingStatement} onClick={() => void generateStatement()} className="mt-2 w-full border border-editorial-black bg-editorial-black px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-white disabled:opacity-50"><PendingButtonContent pending={isGeneratingStatement} pendingLabel="Generating statement…">Preview / download statement</PendingButtonContent></button><p className="mt-2 text-[10px] text-editorial-muted">The statement opens in a branded print preview. Choose Save as PDF or print from the browser dialog.</p></div><div className="flex flex-wrap gap-2 border-t border-editorial-border pt-4">{selectedLease.status !== "TERMINATED" && <button type="button" onClick={() => { setLeaseAction("TERMINATE"); setLeaseActionReason(""); setLeaseActionError(""); }} className="border border-red-300 bg-red-50 px-3 py-2 text-[10px] font-heading font-bold uppercase tracking-wider text-red-800">Cancel contract</button>}{selectedLease.status === "TERMINATED" && <button type="button" onClick={() => { setLeaseAction("RELIST"); setLeaseActionReason(""); setLeaseActionError(""); }} className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-heading font-bold uppercase tracking-wider text-emerald-800">Return property to market</button>}</div></div>}
      </SelectedRowDetailsDialog>

      {leaseAction && selectedLease && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md space-y-4 border border-editorial-border bg-white p-6"><div className="flex items-center justify-between border-b border-editorial-border pb-3"><h3 className="font-heading text-sm font-bold uppercase tracking-wider">{leaseAction === "TERMINATE" ? "Cancel lease contract" : "Return property to market"}</h3><button type="button" onClick={() => setLeaseAction(null)} aria-label="Close"><X className="h-4 w-4" /></button></div><p className="text-xs text-editorial-muted">{leaseAction === "TERMINATE" ? "This ends the active contract and makes the property available for a new mandate. Record the reason." : "Confirm that this property should be available for new rental enquiries."}</p>{leaseAction === "TERMINATE" && <textarea value={leaseActionReason} onChange={(event) => setLeaseActionReason(event.target.value)} rows={4} maxLength={2000} placeholder="Reason for cancelling the contract *" className="w-full border border-editorial-border p-2 text-xs" required />}{leaseActionError && <p className="border border-red-200 bg-red-50 p-2 text-xs text-red-800">{leaseActionError}</p>}<div className="flex justify-end gap-2 border-t border-editorial-border pt-3"><button type="button" onClick={() => setLeaseAction(null)} className="border border-editorial-border px-3 py-2 text-xs uppercase">Keep contract</button><button type="button" disabled={isSubmittingLeaseAction || (leaseAction === "TERMINATE" && !leaseActionReason.trim())} onClick={() => void submitLeaseAction()} className="bg-editorial-black px-3 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"><PendingButtonContent pending={isSubmittingLeaseAction} pendingLabel="Saving…">Confirm</PendingButtonContent></button></div></div></div>}

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
                  <PhoneNumberInput
                    value={formData.tenantPhone}
                    onChange={(tenantPhone) => setFormData({ ...formData, tenantPhone })}
                    label=""
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
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Deposit amount *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Payment day (1-28) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.paymentDayOfMonth}
                    onChange={(e) => setFormData({ ...formData, paymentDayOfMonth: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                    required
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
                  disabled={isCreatingLease}
                  aria-busy={isCreatingLease}
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <PendingButtonContent
                    pending={isCreatingLease}
                    pendingLabel="Creating lease…"
                    icon={<Sparkles className="h-3.5 w-3.5 text-contour-red" />}
                  >
                    Activate Lease
                  </PendingButtonContent>
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
