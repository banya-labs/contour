import { Prisma } from "@prisma/client";
import { organizationMidnight } from "./period";
type Payment = { amountPaid: string | number | Prisma.Decimal; currency: string; periodMonth: number; periodYear: number; status: string; receiptNumber: string; paymentDate: Date; referenceNumber?: string | null; paymentMethod?: string };
export type TenantLedgerInput = {
  monthlyRent: string | number | Prisma.Decimal; currency: string; leaseStartDate: Date; leaseEndDate: Date; paymentDayOfMonth: number; status: string; terminatedAt?: Date | null;
  baseline: { amount: string | number | Prisma.Decimal; month: number; year: number } | null;
  month: number; year: number; payments: Payment[]; now?: Date; timezone?: string;
};
const index = (year: number, month: number) => year * 12 + month - 1;
export function ledgerPaymentPeriodWhere(baselineYear: number, baselineMonth: number, year: number, month: number): Prisma.RentPaymentWhereInput {
  return { AND: [
    { OR: [{ periodYear: { gt: baselineYear } }, { periodYear: baselineYear, periodMonth: { gte: baselineMonth } }] },
    { OR: [{ periodYear: { lt: year } }, { periodYear: year, periodMonth: { lte: month } }] },
  ] };
}
export function calculateTenantLedger(input: TenantLedgerInput) {
  if (!input.baseline) throw new Error("Verify an opening balance and its effective period before generating a tenant statement.");
  if (input.status === "TERMINATED" && !input.terminatedAt) throw new Error("Record the effective termination date before generating this statement.");
  const baselineIndex = index(input.baseline.year, input.baseline.month), selected = index(input.year, input.month);
  if (selected < baselineIndex) throw new Error("The statement period is earlier than the verified opening balance.");
  const zone = input.timezone || "Africa/Lusaka";
  const localDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const monthOf = (d: Date) => { const p = localDate(d); return index(Number(p.find(v => v.type === "year")?.value), Number(p.find(v => v.type === "month")?.value)); };
  const first = monthOf(input.leaseStartDate), last = Math.min(monthOf(input.leaseEndDate), input.terminatedAt ? monthOf(input.terminatedAt) : Infinity);
  const rent = new Prisma.Decimal(input.monthlyRent);
  if (!rent.isPositive()) throw new Error("Monthly rent must be positive.");
  let opening = new Prisma.Decimal(input.baseline.amount), charged = new Prisma.Decimal(0), receiptsTotal = new Prisma.Decimal(0), overdue = new Prisma.Decimal(input.baseline.amount);
  const now = input.now || new Date();
  for (let current = Math.max(baselineIndex, first); current <= Math.min(selected, last); current++) {
    const due = organizationMidnight(Math.floor(current / 12), current % 12 + 1, input.paymentDayOfMonth, zone);
    const effectiveDue = current === first && due < input.leaseStartDate ? input.leaseStartDate : due;
    if (current < selected) opening = opening.plus(rent); else charged = charged.plus(rent);
    if (effectiveDue <= now) overdue = overdue.plus(rent);
  }
  const receipts: Payment[] = [], unconfirmed: Payment[] = [];
  for (const p of input.payments) {
    const current = index(p.periodYear, p.periodMonth);
    if (current < baselineIndex || current > selected || p.paymentDate > now) continue;
    if (p.currency !== input.currency) throw new Error("All rent payments must match the lease currency.");
    if (p.status !== "CONFIRMED") { if (current === selected) unconfirmed.push(p); continue; }
    const amount = new Prisma.Decimal(p.amountPaid);
    if (current < selected) opening = opening.minus(amount); else { receiptsTotal = receiptsTotal.plus(amount); receipts.push(p); }
    overdue = overdue.minus(amount);
  }
  return { openingBalance: opening.toFixed(2), rentCharged: charged.toFixed(2), confirmedPayments: receiptsTotal.toFixed(2), closingBalance: opening.plus(charged).minus(receiptsTotal).toFixed(2), arrears: Prisma.Decimal.max(0, overdue).toFixed(2), receipts, unconfirmed };
}

export function landlordClosingArrears(ledgers: Array<ReturnType<typeof calculateTenantLedger>>) {
  return ledgers.reduce((total, ledger) => total.plus(ledger.arrears), new Prisma.Decimal(0));
}
