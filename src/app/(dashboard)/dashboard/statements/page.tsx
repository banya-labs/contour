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
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-editorial-border pb-4 sm:pb-6">
        <div>
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
            FINANCIAL RECONCILIATION // SEAM V2
          </span>
          <h1 className="font-serif text-xl sm:text-3xl font-bold text-editorial-black tracking-tight mt-0.5 sm:mt-1">
            Landlord Remittance Statements
          </h1>
          <p className="text-xs text-editorial-neutral mt-0.5 sm:mt-1">
            Automated monthly rent reconciliation with 10% management fee deduction and maintenance offsets.
          </p>
        </div>

        <button className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 self-start sm:self-auto">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-editorial-paper/40 border border-editorial-border text-xs">
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
                  <div className="border-l border-editorial-border pl-4">
                    <div className="text-emerald-700 text-[10px] font-mono uppercase tracking-wider font-bold">Net Landlord Payout</div>
                    <div className="font-mono font-bold text-base text-emerald-800 mt-0.5">
                      {formatCurrency(Number(stmt.netLandlordPayout), stmt.currency)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button className="px-4 py-2 rounded-none bg-white border border-editorial-border hover:bg-editorial-paper text-editorial-black text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Statement</span>
                  </button>

                  {!isAuthorized ? (
                    <button
                      onClick={() => handleAuthorizeSeam(stmt.id)}
                      className="px-5 py-2.5 rounded-none bg-editorial-red hover:bg-editorial-red/90 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
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
    </div>
  );
}
