import { z } from "zod";

// Shared by dashboard, PWA and contact API writes.
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
});
