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

export function assertScheduleReconciles(price: string, lines: SaleScheduleLine[]): void {
  const expected = money(price);
  if (lines.length < 1 || lines.length > 360) throw new Error("Schedule must contain between 1 and 360 lines.");
  const total = lines.reduce((sum, line) => {
    const amount = money(line.amount);
    if (!amount.isPositive()) throw new Error("Schedule amounts must be positive.");
    return sum.plus(amount);
  }, new Prisma.Decimal(0));
  if (!total.equals(expected)) throw new Error("Schedule amounts must reconcile exactly to the sale price.");
}

function money(value: Prisma.Decimal | string | number): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function dateOnly(value: Date | string): string {
  if (typeof value === "string") {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
    if (!match) throw new Error("Invalid schedule date.");
    return match[1];
  }
  const raw = value.toISOString();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid schedule date.");
  return date.toISOString().slice(0, 10);
}

function addMonthsToDateString(value: string, months: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new Error(`Invalid schedule date: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = new Date(Date.UTC(year, month - 1 + months, day));
  if (Number.isNaN(result.getTime())) throw new Error("Invalid schedule date.");
  return result.toISOString().slice(0, 10);
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
  const firstDate = dateOnly(input.firstDueDate);
  const remainder = price.minus(deposit);
  if (remainder.isZero()) {
    return [{ sequence: 1, kind: "FULL_PAYMENT", amount: price.toFixed(2), dueDate: firstDate }];
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
    lines.push({ sequence: sequence++, kind: "DEPOSIT", amount: deposit.toFixed(2), dueDate: firstDate });
  }
  const installmentLines = input.installmentAmount ? Math.ceil(Number(remainder.div(requested).toDecimalPlaces(10))) : count;
  for (let index = 0; index < installmentLines; index += 1) {
    const amount = index === installmentLines - 1 ? remaining : requested;
    lines.push({ sequence: sequence++, kind: "INSTALLMENT", amount: amount.toFixed(2), dueDate: addMonthsToDateString(firstDate, interval * (index + (deposit.isPositive() ? 1 : 0))) });
    remaining = remaining.minus(amount);
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
    const status: SaleScheduleSummary["status"] = remaining.isZero() ? "PAID" : line.dueDate < asOf ? "OVERDUE" : applied.greaterThan(0) ? "PART_PAID" : "UNPAID";
    return { ...line, appliedAmount: applied.toFixed(2), remainingAmount: remaining.toFixed(2), status };
  });
  const paid = lines.reduce((total, line) => total.plus(line.appliedAmount), new Prisma.Decimal(0));
  const outstanding = lines.reduce((total, line) => total.plus(line.remainingAmount), new Prisma.Decimal(0));
  const overdue = lines.filter((line) => line.status === "OVERDUE").reduce((total, line) => total.plus(line.remainingAmount), new Prisma.Decimal(0));
  return { paid: paid.toFixed(2), outstanding: outstanding.toFixed(2), overdue: overdue.toFixed(2), lines };
}
