"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Download,
  Plus,
  Lock,
  Bot,
  X,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ContourLogo } from "@/components/brand/contour-logo";

function LandlordStatementsContent() {
  const [statements, setStatements] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    propertyId: "",
    statementMonth: new Date().getMonth() + 1,
    statementYear: new Date().getFullYear(),
    grossRentCollected: "25000",
    agencyFeeDeducted: "2500",
    maintenanceDeducted: "0",
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
          fetch("/api/properties"),
        ]);
        const data = await res.json();
        const propsData = await propsRes.json();
        if (data.success && data.statements) {
          setStatements(data.statements);
        }
        if (propsData.success && propsData.properties) {
          setProperties(propsData.properties);
          if (propsData.properties.length > 0) {
            setFormData((prev) => ({ ...prev, propertyId: propsData.properties[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load statements:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.propertyId) {
      setFormError("Please select a property.");
      return;
    }

    const gross = parseFloat(formData.grossRentCollected) || 0;
    const fee = parseFloat(formData.agencyFeeDeducted) || 0;
    const maint = parseFloat(formData.maintenanceDeducted) || 0;

    if (gross <= 0) {
      setFormError("Gross rent collected must be greater than 0.");
      return;
    }

    try {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          statementMonth: Number(formData.statementMonth),
          statementYear: Number(formData.statementYear),
          grossRentCollected: gross,
          agencyFeeDeducted: fee,
          maintenanceDeducted: maint,
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
    } catch (err: any) {
      setFormError(err.message || "Network error generating statement.");
    }
  };

  const handleAuthorizeSeam = async (id: string) => {
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
    } catch (err: any) {
      alert("Error authorizing statement: " + err.message);
    }
  };

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist">
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
            Automated monthly rent reconciliation with 10% management fee deduction and maintenance offsets.
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
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-none border border-editorial-border">
            <Bot className="animate-spin w-8 h-8 mb-2 text-editorial-red" />
            <span className="text-xs font-mono text-editorial-neutral">Loading landlord statements from database...</span>
          </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 bg-editorial-paper/40 border border-editorial-border text-xs">
                  <div>
                    <div className="text-editorial-neutral text-[10px] font-mono uppercase tracking-wider font-semibold">Gross Rent Collected</div>
                    <div className="font-mono font-bold text-editorial-black text-sm mt-1">
                      {formatCurrency(Number(stmt.grossRentCollected), stmt.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-editorial-neutral text-[10px] font-mono uppercase tracking-wider font-semibold">Agency Fee (10%)</div>
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
                      className="w-full sm:w-auto px-5 py-2.5 rounded-none bg-editorial-red hover:bg-editorial-red/90 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize &amp; Disburse Remittance</span>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Gross Rent Collected *
                  </label>
                  <input
                    type="number"
                    value={formData.grossRentCollected}
                    onChange={(e) => {
                      const gross = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        grossRentCollected: e.target.value,
                        agencyFeeDeducted: (gross * 0.10).toFixed(0),
                      });
                    }}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
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
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    10% Agency Fee
                  </label>
                  <input
                    type="number"
                    value={formData.agencyFeeDeducted}
                    onChange={(e) => setFormData({ ...formData, agencyFeeDeducted: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Maintenance Deduction
                  </label>
                  <input
                    type="number"
                    value={formData.maintenanceDeducted}
                    onChange={(e) => setFormData({ ...formData, maintenanceDeducted: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-editorial-border flex items-center justify-between">
                <span className="text-editorial-neutral font-heading text-xs uppercase tracking-wider">
                  Net Landlord Remittance:
                </span>
                <span className="font-geist font-bold text-emerald-800 text-sm">
                  {formatCurrency(
                    (parseFloat(formData.grossRentCollected) || 0) -
                    (parseFloat(formData.agencyFeeDeducted) || 0) -
                    (parseFloat(formData.maintenanceDeducted) || 0),
                    formData.currency as any
                  )}
                </span>
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
                  <span>Generate Statement</span>
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
