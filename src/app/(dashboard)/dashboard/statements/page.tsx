"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Download,
  Plus,
  Lock,
  Bot,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function LandlordStatementsPage() {
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatements() {
      try {
        const res = await fetch("/api/statements");
        const data = await res.json();
        if (data.success && data.statements) {
          setStatements(data.statements);
        }
      } catch (err) {
        console.error("Failed to load statements:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatements();
  }, []);

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
    <div className="p-6 sm:p-8 pb-32 sm:pb-40 space-y-6 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
            Financial Reconciliation
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
            Landlord Remittance Statements
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Automated monthly rent reconciliation with 10% management fee deduction and maintenance offsets.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold transition-transform active:scale-95 shadow-subtle flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" />
          <span>Generate Statement</span>
        </button>
      </div>

      {/* Seam Notice Box */}
      <div className="bg-paper-200 border border-border p-4 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-contour-red shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-ink-800">
          <span className="font-bold text-ink-900">The DocuSign Human Approval Seam Active</span>
          <p className="text-ink-600 leading-relaxed">
            AI agents calculate ledger deductions and draft PDF statements. Under Banya Labs operating doctrine, an authorized Principal Broker or Finance Officer must physically sign off before net remittances are disbursed to landlord bank accounts.
          </p>
        </div>
      </div>

      {/* Statements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-border shadow-card">
            <Bot className="animate-spin w-8 h-8 mb-2 text-contour-red" />
            <span className="text-xs text-ink-600 font-medium">Loading landlord statements from database...</span>
          </div>
        ) : statements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-border shadow-card text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-ink-400" />
            <h3 className="font-semibold text-ink-900">No statements generated</h3>
            <p className="text-sm text-ink-600 max-w-sm">No landlord remittance statements have been generated for this month yet.</p>
          </div>
        ) : (
          statements.map((stmt) => {
            const isAuthorized = stmt.status === "PAID_OUT";
            const monthStr = `${MONTHS[stmt.statementMonth - 1]} ${stmt.statementYear}`;

            return (
              <div
                key={stmt.id}
                className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">
                      {monthStr} Statement
                    </span>
                    <h3 className="font-bold text-base text-ink-900">{stmt.property?.title || "Untitled Property"}</h3>
                    <div className="text-xs text-ink-600">Landlord: {stmt.landlordName}</div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      isAuthorized
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isAuthorized ? "Remittance Authorized" : "Pending Human Sign-Off"}
                  </span>
                </div>

                {/* Equation Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-paper-100 border border-border text-xs">
                  <div>
                    <div className="text-ink-600 text-[10px] uppercase font-semibold">Gross Rent Collected</div>
                    <div className="font-mono font-bold text-ink-900 mt-1">
                      {formatCurrency(Number(stmt.grossRentCollected), stmt.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-ink-600 text-[10px] uppercase font-semibold">Agency Fee (10%)</div>
                    <div className="font-mono font-bold text-contour-red mt-1">
                      - {formatCurrency(Number(stmt.agencyFeeDeducted), stmt.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-ink-600 text-[10px] uppercase font-semibold">Maintenance Offsets</div>
                    <div className="font-mono font-bold text-ink-800 mt-1">
                      - {formatCurrency(Number(stmt.maintenanceDeducted), stmt.currency)}
                    </div>
                  </div>
                  <div className="border-l border-paper-300 pl-4">
                    <div className="text-contour-emerald text-[10px] uppercase font-bold">Net Landlord Payout</div>
                    <div className="font-mono font-bold text-base text-contour-emerald mt-0.5">
                      {formatCurrency(Number(stmt.netLandlordPayout), stmt.currency)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button className="px-3.5 py-1.5 rounded-full bg-paper-200 hover:bg-paper-300 text-ink-900 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Statement</span>
                  </button>

                  {!isAuthorized ? (
                    <button
                      onClick={() => handleAuthorizeSeam(stmt.id)}
                      className="px-5 py-2 rounded-full bg-contour-red hover:bg-contour-red/90 text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize & Disburse Remittance</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-contour-emerald font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorized for bank wire remittance</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
