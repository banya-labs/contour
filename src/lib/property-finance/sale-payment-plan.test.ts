import { describe, expect, it } from "vitest";
import { buildSaleSchedule, summarizeSaleSchedule } from "./sale-payment-plan";

describe("sale payment plan schedule", () => {
  it("reconciles a deposit and final rounded installment", () => {
    const lines = buildSaleSchedule({ price: "300000", deposit: "60000", installmentAmount: "20000", installmentCount: 12, firstDueDate: "2026-11-01" });
    expect(lines).toHaveLength(13);
    expect(lines.at(-1)?.amount).toBe("20000.00");
    expect(lines.reduce((sum, line) => sum + Number(line.amount), 0)).toBe(300000);
  });

  it("reports partial payment and only past-due outstanding as overdue", () => {
    const lines = buildSaleSchedule({ price: "300", deposit: "100", installmentAmount: "100", installmentCount: 2, firstDueDate: "2026-01-01" });
    const summary = summarizeSaleSchedule({ lines, allocations: [{ installmentSequence: 1, amount: "100" }, { installmentSequence: 2, amount: "40" }], asOfDate: "2026-02-15" });
    expect(summary.paid).toBe("240.00");
    expect(summary.outstanding).toBe("60.00");
    expect(summary.overdue).toBe("60.00");
    expect(summary.lines[1].status).toBe("PART_PAID");
  });
});
