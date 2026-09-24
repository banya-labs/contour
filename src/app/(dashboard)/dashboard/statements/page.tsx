"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Download,
  Plus,
  Lock,
  X,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ContourLogo } from "@/components/brand/contour-logo";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { isKeyPending, setKeyPending } from "@/lib/loading-feedback";
import { mutationTouchesScope, WORKSPACE_MUTATION_EVENT, type WorkspaceMutationEventDetail } from "@/lib/workspace-events";

type Statement = {
  id: string;
  status: string;
  landlordName: string;
  currency: string;
  grossRentCollected: number | string;
  rentDue: number | string;
  arrearsClosing: number | string;
  agencyFeeDeducted: number | string;
  maintenanceDeducted: number | string;
  netLandlordPayout: number | string;
  property?: { title?: string; suburb?: string };
  statementMonth: number;
  statementYear: number;
};

type RentalProperty = { id: string; title: string; suburb?: string; listingType: string };

function LandlordStatementsContent() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [isCreatingStatement, setIsCreatingStatement] = useState(false);
  const [pendingAuthorizations, setPendingAuthorizations] =
    useState<ReadonlySet<string>>(new Set());

  const [formData, setFormData] = useState({
    propertyId: "",
    statementMonth: new Date().getMonth() + 1,
    statementYear: new Date().getFullYear(),
    currency: "ZMW",
  });

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1" || searchParams?.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        const [res, propsRes] = await Promise.all([
          fetch("/api/statements"),
          fetch("/api/properties?status=ALL"),
        ]);
        const data = await res.json();
        const propsData = await propsRes.json();
        if (data.success && data.statements) {
          setStatements(data.statements);
        }
        if (propsData.success && propsData.properties) {
          const rentalProperties = propsData.properties.filter(
            (property: RentalProperty) => property.listingType === "FOR_RENT" || property.listingType === "BOTH"
          );
          setProperties(rentalProperties);
          if (rentalProperties.length > 0) {
            setFormData((prev) => ({ ...prev, propertyId: rentalProperties[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load statements:", err);
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

  const handleCreateStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.propertyId) {
      setFormError("Please select a property.");
      return;
    }

    setIsCreatingStatement(true);
    try {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          statementMonth: Number(formData.statementMonth),
          statementYear: Number(formData.statementYear),
          currency: formData.currency,
        }),
      });

      const data = await res.json();
      if (data.success && data.statement) {
        setStatements([data.statement, ...statements]);
        setIsModalOpen(false);
        alert("[SUCCESS] Draft Landlord Statement generated!");
      } else {
        setFormError(data.error || "Failed to generate statement.");
      }
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Network error generating statement.");
    } finally {
      setIsCreatingStatement(false);
    }
  };

  const handleAuthorizeSeam = async (id: string) => {
    const actionKey = `${id}:authorize`;
    setPendingAuthorizations((state) => setKeyPending(state, actionKey, true));
    try {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PAID_OUT" })
      });
      const data = await res.json();
      if (data.success && data.statement) {
        setStatements(prev => prev.map(s => s.id === id ? { ...s, status: "PAID_OUT" } : s));
        alert("DocuSign Seam Signed! Landlord Statement approved and remittance payout authorized.");
      } else {
        alert("Failed to authorize statement: " + (data.error || "Unknown error"));
      }
    } catch (caught) {
      alert("Error authorizing statement: " + (caught instanceof Error ? caught.message : "Unknown error"));
    } finally {
      setPendingAuthorizations((state) => setKeyPending(state, actionKey, false));
    }
  };

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist">
      <div className="flex gap-1 border-b border-editorial-border pb-2">
        <Link href="/dashboard/leases" className="px-3 py-2 text-xs font-heading font-semibold text-editorial-muted hover:text-editorial-black">Leases</Link>
        <Link href="/dashboard/leases?tab=statements" aria-current="page" className="px-3 py-2 text-xs font-heading font-semibold bg-editorial-black text-white">Statements</Link>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-editorial-border pb-4 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ContourLogo size="sm" compact />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
              FINANCIAL RECONCILIATION // SEAM V2
            </span>
          </div>
          <h1 className="font-serif text-xl sm:text-3xl font-bold text-editorial-black tracking-tight mt-0.5 sm:mt-1">
            Landlord Remittance Statements
          </h1>
            <p className="text-xs text-editorial-neutral mt-0.5 sm:mt-1">
            Monthly rental ledger reconciliation from confirmed payments, approved expenses, and lease arrears.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 sm:px-5 py-2.5 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 self-stretch sm:self-auto min-h-[44px] sm:min-h-0"
        >
          <Plus className="w-3.5 h-3.5 text-editorial-red" />
          <span>Generate Statement</span>
        </button>
      </div>

      {/* Seam Notice Box */}
      <div className="bg-editorial-paper/50 border border-editorial-border p-4 sm:p-5 rounded-none flex items-start gap-3">
        <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-editorial-red shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-editorial-black">
          <span className="font-mono font-bold text-editorial-black uppercase tracking-wider text-[10px] sm:text-[11px] block">
            The DocuSign Human Approval Seam Active
          </span>
          <p className="text-editorial-neutral leading-relaxed">
            AI agents calculate ledger deductions and draft PDF statements. Under Banya Labs operating doctrine, an authorized Principal Broker or Finance Officer must physically sign off before net remittances are disbursed to landlord bank accounts.
          </p>
        </div>
      </div>

      {/* Statements List */}
      <div className="space-y-4">
        {loading ? (
          <SectionPendingState label="Loading landlord statements…" />
        ) : statements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-none border border-editorial-border text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-editorial-neutral/50" />
            <h3 className="font-serif font-bold text-editorial-black text-lg">No statements generated</h3>
            <p className="text-xs text-editorial-neutral max-w-sm">No landlord remittance statements have been generated for this month yet.</p>
          </div>
        ) : (
          statements.map((stmt) => {
            const isAuthorized = stmt.status === "PAID_OUT";
            const monthStr = `${MONTHS[stmt.statementMonth - 1]} ${stmt.statementYear}`;

            return (
              <div
                key={stmt.id}
                className="bg-white rounded-none p-6 border border-editorial-border space-y-4 hover:border-editorial-black transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-editorial-border pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-editorial-neutral block">
                      STATEMENT REF // {monthStr.toUpperCase()}
                    </span>
                    <h3 className="font-serif font-bold text-lg text-editorial-black mt-0.5">
                      {stmt.property?.title || "Untitled Property"}
                    </h3>
                    <div className="text-xs text-editorial-neutral font-mono mt-0.5">
                      Landlord: <span className="text-editorial-black font-semibold">{stmt.landlordName}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-[11px] font-mono font-bold uppercase tracking-wider self-start sm:self-auto border ${
                      isAuthorized
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 ${isAuthorized ? "bg-emerald-600" : "bg-amber-600"}`} />
                    {isAuthorized ? "Remittance Authorized" : "Pending Human Sign-Off"}
                  </span>
                </div>

                {/* Equation Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 p-4 bg-editorial-paper/40 border border-editorial-border text-xs">
                  <div>
                    <div className="text-editorial-neutral text-[10px] font-mono uppercase tracking-wider font-semibold">Rent Due</div>
                    <div className="font-mono font-bold text-editorial-black text-sm mt-1">{formatCurrency(Number(stmt.rentDue), stmt.currency)}</div>
                  </div>
                  <div>
                    <div className="text-editorial-neutral text-[10px] font-mono uppercase tracking-wider font-semibold">Gross Rent Collected</div>
                    <div className="font-mono font-bold text-editorial-black text-sm mt-1">
                      {formatCurrency(Number(stmt.grossRentCollected), stmt.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-editorial-neutral text-[10px] font-mono uppercase tracking-wider font-semibold">Agency Fee</div>
                    <div className="font-mono font-bold text-editorial-red text-sm mt-1">
                      - {formatCurrency(Number(stmt.agencyFeeDeducted), stmt.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-editorial-neutral text-[10px] font-mono uppercase tracking-wider font-semibold">Maintenance Offsets</div>
                    <div className="font-mono font-bold text-editorial-black text-sm mt-1">
                      - {formatCurrency(Number(stmt.maintenanceDeducted), stmt.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-editorial-neutral text-[10px] font-mono uppercase tracking-wider font-semibold">Closing Arrears</div>
                    <div className="font-mono font-bold text-amber-800 text-sm mt-1">{formatCurrency(Number(stmt.arrearsClosing), stmt.currency)}</div>
                  </div>
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1 border-t sm:border-t-0 lg:border-l border-editorial-border pt-3 sm:pt-0 lg:pl-4">
                    <div className="text-emerald-700 text-[10px] font-mono uppercase tracking-wider font-bold">Net Landlord Payout</div>
                    <div className="font-mono font-bold text-base text-emerald-800 mt-0.5">
                      {formatCurrency(Number(stmt.netLandlordPayout), stmt.currency)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <button className="w-full sm:w-auto px-4 py-2.5 rounded-none bg-white border border-editorial-border hover:bg-editorial-paper text-editorial-black text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] sm:min-h-0">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Statement</span>
                  </button>

                  {!isAuthorized ? (
                    <button
                      onClick={() => handleAuthorizeSeam(stmt.id)}
                      disabled={isKeyPending(pendingAuthorizations, `${stmt.id}:authorize`)}
                      aria-busy={isKeyPending(pendingAuthorizations, `${stmt.id}:authorize`)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-none bg-editorial-red hover:bg-editorial-red/90 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <PendingButtonContent
                        pending={isKeyPending(pendingAuthorizations, `${stmt.id}:authorize`)}
                        pendingLabel="Authorising statement…"
                        icon={<Lock className="h-3.5 w-3.5" />}
                      >
                        Authorize &amp; Disburse Remittance
                      </PendingButtonContent>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-mono font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Authorized for bank wire remittance</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-geist">
          <div className="bg-white max-w-lg w-full p-6 border border-editorial-border space-y-4">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-editorial-red" />
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
                  Generate Landlord Remittance Statement
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

            <form onSubmit={handleCreateStatement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Managed Property *
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.suburb})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Statement Month
                  </label>
                  <select
                    value={formData.statementMonth}
                    onChange={(e) => setFormData({ ...formData, statementMonth: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Statement Year
                  </label>
                  <input
                    type="number"
                    value={formData.statementYear}
                    onChange={(e) => setFormData({ ...formData, statementYear: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed">
                Statement figures are generated from confirmed rent payments, approved or paid maintenance expenses, and active lease arrears. No amounts are entered manually.
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
                  disabled={isCreatingStatement}
                  aria-busy={isCreatingStatement}
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <PendingButtonContent
                    pending={isCreatingStatement}
                    pendingLabel="Generating statement…"
                    icon={<Sparkles className="h-3.5 w-3.5 text-contour-red" />}
                  >
                    Generate Statement
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

export default function LandlordStatementsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-mono text-editorial-muted">Loading statements...</div>}>
      <LandlordStatementsContent />
    </React.Suspense>
  );
}
