import { z } from "zod";

export const ONBOARDING_STATUSES = [
  "AUTHENTICATED_NO_ORGANIZATION", "ORGANIZATION_PROFILE_REQUIRED", "BRANDING_OPTIONAL",
  "INVITE_TEAM_OPTIONAL", "ONBOARDING_COMPLETE", "ONBOARDING_ERROR",
] as const;

export const agencyProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(48),
  country: z.enum(["ZM", "ZA", "ZW"]).default("ZM"),
  currency: z.enum(["ZMW", "ZAR", "USD"]).default("ZMW"),
  timezone: z.string().trim().min(1).max(64).default("Africa/Lusaka"),
  agencyType: z.enum(["BROKERAGE", "PROPERTY_MANAGEMENT", "DEVELOPER", "LANDLORD", "MIXED"]).default("BROKERAGE"),
  primaryOfficeAddress: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  primaryPhone: z.string().trim().max(32).optional().or(z.literal("")),
  primaryEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  // Statutory Zambia Regulatory & Compliance Declarations
  pacraRegistrationNumber: z.string().trim().max(60).optional().or(z.literal("")),
  ziereaLicenseNumber: z.string().trim().max(60).optional().or(z.literal("")),
  dpoName: z.string().trim().max(100).optional().or(z.literal("")),
  dpoEmail: z.string().trim().max(160).optional().or(z.literal("")),
  regulatoryDeclarationAgreed: z.boolean().default(true),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  roleKey: z.enum(["BROKER_MANAGER", "ADMIN_STAFF", "FIELD_AGENT", "FINANCE_OFFICER", "VAULT_MANAGER", "LANDLORD", "TENANT"]),
  note: z.string().trim().max(500).optional(),
});

export type AgencyProfileInput = z.infer<typeof agencyProfileSchema>;

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

export function parseInviteInput(input?: string): { invitationId?: string; token?: string } {
  if (!input) return {};
  const trimmed = input.trim();
  if (!trimmed) return {};

  try {
    const url = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(trimmed, "http://dummy.local");

    const pathParts = url.pathname.split("/").filter(Boolean);
    const acceptIndex = pathParts.indexOf("accept-invitation");
    let invitationId: string | undefined;
    if (acceptIndex !== -1 && pathParts[acceptIndex + 1]) {
      invitationId = pathParts[acceptIndex + 1];
    }
    const token = url.searchParams.get("token") || undefined;
    if (invitationId || token) {
      return { invitationId, token };
    }
  } catch {
    // Not a URL
  }

  if (trimmed.includes("token=")) {
    const match = trimmed.match(/token=([a-zA-Z0-9_-]+)/);
    if (match) {
      return { token: match[1] };
    }
  }

  return { invitationId: trimmed, token: trimmed };
}
