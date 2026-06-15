import { describe, expect, it, vi } from "vitest";
import {
  createContourClient,
  findContourClientDuplicateHints,
  parseContourClientFormData,
  updateContourClient,
} from "./clients";

describe("client helpers", () => {
  it("normalizes client form data for storage", () => {
    const formData = new FormData();
    formData.set("fullName", "  M. Chanda  ");
    formData.set("email", "m@example.com");
    formData.set("phone", "  ");
    formData.set("status", "active");
    formData.set("source", "Referral");

    expect(parseContourClientFormData(formData)).toEqual({
      fullName: "M. Chanda",
      email: "m@example.com",
      phone: null,
      status: "active",
      source: "Referral",
    });
  });

  it("creates and updates clients with the canonical db shape", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "client-1",
      fullName: "M. Chanda",
      email: "m@example.com",
      phone: null,
      status: "active",
      source: "Referral",
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T08:00:00.000Z"),
    });
    const update = vi.fn().mockResolvedValue({
      id: "client-1",
      fullName: "M. Chanda",
      email: "m@example.com",
      phone: "+260971000000",
      status: "active",
      source: "Referral",
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T09:00:00.000Z"),
    });
    const findMany = vi.fn().mockResolvedValue([
      { id: "client-2", fullName: "Moses Chanda", email: "m@example.com", phone: null },
    ]);
    const prisma = {
      client: {
        create,
        update,
        findMany,
      },
    };

    const created = await createContourClient(prisma as never, {
      fullName: "M. Chanda",
      email: "m@example.com",
      phone: null,
      status: "active",
      source: "Referral",
    });
    const updated = await updateContourClient(prisma as never, "client-1", {
      fullName: "M. Chanda",
      email: "m@example.com",
      phone: "+260971000000",
      status: "active",
      source: "Referral",
    });
    const duplicates = await findContourClientDuplicateHints(prisma as never, {
      email: "m@example.com",
      phone: null,
      excludeId: "client-1",
    });

    expect(create).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(created.id).toBe("client-1");
    expect(updated.phone).toBe("+260971000000");
    expect(duplicates).toHaveLength(1);
  });
});
