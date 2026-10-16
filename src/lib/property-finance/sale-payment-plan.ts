import { Prisma } from "@prisma/client";

export type SaleScheduleLine = {
  sequence: number;
  kind: "DEPOSIT" | "INSTALLMENT" | "FULL_PAYMENT";
  amount: string;
  dueDate: string;
  carriedPaidAmount?: string;
};

export type SaleScheduleSummary = SaleScheduleLine & {
  appliedAmount: string;
  remainingAmount: string;
  status: "UNPAID" | "PART_PAID" | "PAID" | "OVERDUE";
};

function money(value: Prisma.Decimal | string | number): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function dateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid schedule date.");
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/** Builds a bounded schedule whose lines reconcile exactly to the sale price. */
export function buildSaleSchedule(input: {
  price: string;
  deposit?: string;
  installmentAmount?: string;
  installmentCount?: number;
  firstDueDate: Date | string;
  intervalMonths?: number;
}): SaleScheduleLine[] {
  const price = money(input.price);
  if (!price.isPositive()) throw new Error("Sale price must be positive.");
  const deposit = money(input.deposit ?? "0");
  if (deposit.isNegative() || deposit.greaterThan(price)) throw new Error("Deposit must be between zero and the sale price.");
  const firstDate = new Date(`${dateOnly(input.firstDueDate)}T00:00:00.000Z`);
  const remainder = price.minus(deposit);
  if (remainder.isZero()) {
    return [{ sequence: 1, kind: "FULL_PAYMENT", amount: price.toFixed(2), dueDate: dateOnly(firstDate) }];
  }
  const count = input.installmentCount ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 360) throw new Error("Installment count must be between 1 and 360.");
  const interval = input.intervalMonths ?? 1;
  if (!Number.isInteger(interval) || interval < 1 || interval > 12) throw new Error("Installment interval must be between 1 and 12 months.");
  const requested = input.installmentAmount ? money(input.installmentAmount) : remainder.div(count).toDecimalPlaces(2);
  if (!requested.isPositive()) throw new Error("Installment amount must be positive.");
  const lines: SaleScheduleLine[] = [];
  let remaining = remainder;
  let sequence = 1;
  if (deposit.isPositive()) {
    lines.push({ sequence: sequence++, kind: "DEPOSIT", amount: deposit.toFixed(2), dueDate: dateOnly(firstDate) });
  }
  let dueDate = firstDate;
  while (remaining.isPositive()) {
    const amount = Prisma.Decimal.min(requested, remaining);
    lines.push({ sequence: sequence++, kind: "INSTALLMENT", amount: amount.toFixed(2), dueDate: dateOnly(dueDate) });
    remaining = remaining.minus(amount);
    dueDate = addMonths(dueDate, interval);
  }
  if (lines.length > 361) throw new Error("Schedule exceeds the maximum supported number of lines.");
  return lines;
}

export function summarizeSaleSchedule(input: {
  lines: SaleScheduleLine[];
  allocations: Array<{ installmentSequence: number; amount: string }>;
  asOfDate: Date | string;
}): { paid: string; outstanding: string; overdue: string; lines: SaleScheduleSummary[] } {
  const asOf = dateOnly(input.asOfDate);
  const allocationBySequence = new Map<number, Prisma.Decimal>();
  for (const allocation of input.allocations) {
    const amount = money(allocation.amount);
    if (!amount.isPositive()) throw new Error("Payment allocations must be positive.");
    allocationBySequence.set(allocation.installmentSequence, (allocationBySequence.get(allocation.installmentSequence) ?? new Prisma.Decimal(0)).plus(amount));
  }
  const lines = input.lines.map((line) => {
    const expected = money(line.amount);
    const carried = money(line.carriedPaidAmount ?? "0");
    const applied = Prisma.Decimal.min(expected, carried.plus(allocationBySequence.get(line.sequence) ?? 0));
    const remaining = expected.minus(applied);
    const status: SaleScheduleSummary["status"] = remaining.isZero() ? "PAID" : applied.isPositive() ? "PART_PAID" : line.dueDate < asOf ? "OVERDUE" : "UNPAID";
    return { ...line, appliedAmount: applied.toFixed(2), remainingAmount: remaining.toFixed(2), status };
  });
  const paid = lines.reduce((total, line) => total.plus(line.appliedAmount), new Prisma.Decimal(0));
  const outstanding = lines.reduce((total, line) => total.plus(line.remainingAmount), new Prisma.Decimal(0));
  const overdue = lines.filter((line) => line.status === "OVERDUE").reduce((total, line) => total.plus(line.remainingAmount), new Prisma.Decimal(0));
  return { paid: paid.toFixed(2), outstanding: outstanding.toFixed(2), overdue: overdue.toFixed(2), lines };
}
