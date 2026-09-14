import { describe, expect, it } from "vitest";
import { updateInquiryPipelineSchema, createInquirySchema } from "./index";

describe("Pipeline Outcome and Validation Rules", () => {
  describe("updateInquiryPipelineSchema", () => {
    it("allows transitioning between open pipeline stages without outcome", () => {
      const result = updateInquiryPipelineSchema.safeParse({
        status: "VIEWING_SCHEDULED",
        dealValue: 1200000,
      });

      expect(result.success).toBe(true);
    });

    it("fails when status is CLOSED but outcome is omitted", () => {
      const result = updateInquiryPipelineSchema.safeParse({
        status: "CLOSED",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Closed inquiries require a won or lost outcome.");
      }
    });

    it("succeeds when status is CLOSED and outcome is WON without lostReason", () => {
      const result = updateInquiryPipelineSchema.safeParse({
        status: "CLOSED",
        outcome: "WON",
        dealValue: 2500000,
      });

      expect(result.success).toBe(true);
    });

    it("fails when status is CLOSED, outcome is LOST, but lostReason is omitted", () => {
      const result = updateInquiryPipelineSchema.safeParse({
        status: "CLOSED",
        outcome: "LOST",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("A lost reason is required.");
      }
    });

    it("fails when status is CLOSED, outcome is LOST, but lostReason is shorter than 10 chars", () => {
      const result = updateInquiryPipelineSchema.safeParse({
        status: "CLOSED",
        outcome: "LOST",
        lostReason: "Too high",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("10 character(s)");
      }
    });

    it("succeeds when status is CLOSED, outcome is LOST, and lostReason has >= 10 chars", () => {
      const result = updateInquiryPipelineSchema.safeParse({
        status: "CLOSED",
        outcome: "LOST",
        lostReason: "Buyer selected alternative stand in Roma Park",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("createInquirySchema", () => {
    it("accepts WALK_IN as a valid lead source", () => {
      const result = createInquirySchema.safeParse({
        clientName: "Mwamba Chileshe",
        clientPhone: "+260977123456",
        leadSource: "WALK_IN",
        lookingFor: "FOR_SALE",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.leadSource).toBe("WALK_IN");
      }
    });
  });
});
