import { z } from "zod";
import { cleanLocationValues } from "@/lib/locations/normalize-location";

export const CurrencyEnum = z.enum(["ZMW", "USD", "ZAR"]);
export const OwnershipTypeEnum = z.enum(["COMPANY_OWNED", "MANAGED_ON_BEHALF"]);
export const PropertyTypeEnum = z.enum([
  "STANDALONE_HOUSE",
  "APARTMENT",
  "COMMERCIAL_OFFICE",
  "WAREHOUSE",
  "VACANT_LAND_PLOT",
  "FARM_AGRICULTURAL",
]);
export const ListingTypeEnum = z.enum(["FOR_SALE", "FOR_RENT", "BOTH"]);
export const LeadSourceEnum = z.enum([
  "WEBSITE",
  "WHATSAPP",
  "CLIENT_REFERRAL",
  "WALK_IN",
  "SOCIAL_MEDIA",
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "PROPERTY_PORTAL",
  "PHONE",
  "OTHER",
]);
export const PipelineOutcomeEnum = z.enum(["WON", "LOST"]);
export const PropertyStatusEnum = z.enum([
  "AVAILABLE",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
  "MAINTENANCE_HOLD",
  "DRAFT",
  "ARCHIVED",
]);

export const createPropertySchema = z.object({
  title: z.string().min(3).max(120),
  ownershipType: OwnershipTypeEnum.default("MANAGED_ON_BEHALF"),
  propertyType: PropertyTypeEnum,
  listingType: ListingTypeEnum.default("FOR_SALE"),
  askingPrice: z.number().positive().optional(),
  rentalPrice: z.number().positive().optional(),
  currency: CurrencyEnum.default("ZMW"),
  agencyCommissionPct: z.number().min(0).max(100).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().min(0).max(50).optional(),
  plotSizeSqm: z.number().nonnegative().optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).default([]),
  featuredPhoto: z.string().optional(),
  suburb: z.string().min(2).max(80),
  city: z.string().trim().max(120).default(""),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  landmarkDirections: z.string().max(500).optional(),
  ownerName: z.string().max(100).optional(),
  ownerPhone: z.string().max(30).optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")).or(z.null()),
  ownerBankDetails: z.string().max(500).optional(),
  titleDeedNumber: z.string().max(60).optional(),
  assignedAgentId: z.string().optional(),
  mandateDeclarationAgreed: z.boolean().default(true).refine((val) => val === true, {
    message: "Statutory mandate declaration must be agreed before publishing a listing.",
  }),
  mandateType: z.enum(["SOLE_MANDATE", "OPEN_MANDATE", "COMPANY_OWNED"]).default("SOLE_MANDATE"),
  mandateReference: z.string().max(100).optional(),
  // Boundary extraction is retired; reject legacy payloads without changing stored geometry.
  standBoundary: z.never().optional(),
  titleDeedDocumentId: z.never().optional(),
});

export const updatePropertySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(120).optional(),
  ownershipType: OwnershipTypeEnum.optional(),
  propertyType: PropertyTypeEnum.optional(),
  listingType: ListingTypeEnum.optional(),
  status: PropertyStatusEnum.optional(),
  askingPrice: z.number().positive().nullable().optional(),
  rentalPrice: z.number().positive().nullable().optional(),
  currency: CurrencyEnum.optional(),
  agencyCommissionPct: z.number().min(0).max(100).optional(),
  bedrooms: z.number().int().min(0).max(50).nullable().optional(),
  bathrooms: z.number().min(0).max(50).nullable().optional(),
  plotSizeSqm: z.number().nonnegative().nullable().optional(),
  description: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  featuredPhoto: z.string().nullable().optional(),
  suburb: z.string().min(2).max(80).optional(),
  city: z.string().trim().max(120).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  landmarkDirections: z.string().max(500).nullable().optional(),
  ownerName: z.string().max(100).nullable().optional(),
  ownerPhone: z.string().max(30).nullable().optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")).or(z.null()),
  ownerBankDetails: z.string().max(500).nullable().optional(),
  titleDeedNumber: z.string().max(60).nullable().optional(),
  assignedAgentId: z.string().nullable().optional(),
  assignedAgentName: z.string().nullable().optional(),
  assignedAgentPhone: z.string().nullable().optional(),
  mandateDeclarationAgreed: z.boolean().optional(),
  mandateType: z.enum(["SOLE_MANDATE", "OPEN_MANDATE", "COMPANY_OWNED"]).optional(),
  mandateReference: z.string().max(100).nullable().optional(),
  // Boundary extraction is retired; reject legacy payloads without changing stored geometry.
  standBoundary: z.never().optional(),
  titleDeedDocumentId: z.never().optional(),
  dealParties: z.any().optional(),
}).passthrough();

export const createLeaseSchema = z.object({
  propertyId: z.string(),
  inquiryId: z.string().optional(),
  tenantName: z.string().min(2).max(100),
  tenantPhone: z.string().min(6).max(30),
  tenantEmail: z.string().email().optional(),
  tenantIdNumber: z.string().max(50).optional(),
  monthlyRent: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  depositAmount: z.number().nonnegative(),
  managementFeePercent: z.number().min(0).max(100),
  leaseStartDate: z.string(),
  leaseEndDate: z.string(),
  paymentDayOfMonth: z.number().int().min(1).max(28),
});

export const recordRentPaymentSchema = z.object({
  leaseId: z.string(),
  amountPaid: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2035),
  paymentDate: z.string(),
  paymentMethod: z.enum(["BANK_TRANSFER", "MOBILE_MONEY_AIRTEL", "MOBILE_MONEY_MTN", "CASH", "CHEQUE"]).default("BANK_TRANSFER"),
  referenceNumber: z.string().max(80).optional(),
  idempotencyKey: z.string().optional(),
  notes: z.string().max(300).optional(),
});

export const recordMaintenanceExpenseSchema = z.object({
  propertyId: z.string(),
  description: z.string().min(3).max(200),
  vendorName: z.string().max(100).optional(),
  amount: z.number().positive(),
  currency: CurrencyEnum.default("ZMW"),
  receiptPhotoUrl: z.string().optional(),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2035),
});

export const generateLandlordStatementSchema = z.object({
  propertyId: z.string(),
  statementMonth: z.number().int().min(1).max(12),
  statementYear: z.number().int().min(2020).max(2035),
  currency: CurrencyEnum.default("ZMW"),
  regenerate: z.boolean().default(false),
});

export const matchingPreferencesSchema = z.object({
  mustHave: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  niceToHave: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  keywords: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  strictRequirements: z.object({ budgetMax: z.boolean().optional(), preferredAreas: z.boolean().optional(), bedroomsMin: z.boolean().optional(), bathroomsMin: z.boolean().optional(), areaMinSqm: z.boolean().optional() }).optional(),
});
export const createInquirySchema = z.object({
  matchingProfile: matchingPreferencesSchema.optional(),
  creationSurface: z.enum(["DESKTOP", "PWA"]).optional(),
  existingInquiryId: z.string().optional(),
  contactId: z.string().optional(),
  idempotencyKey: z.string().min(8).max(120).optional(),
    clientName: z.string().trim().min(2).max(100),
    clientPhone: z.string().trim().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")),
  lookingFor: ListingTypeEnum.default("FOR_SALE"),
  propertyType: PropertyTypeEnum.optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  currency: CurrencyEnum.default("ZMW"),
  preferredSuburbs: z.array(z.string().trim().max(80)).default([]).transform(cleanLocationValues),
  bedroomsMin: z.number().int().min(0).max(50).optional(),
  bathroomsMin: z.number().min(0).max(50).optional(),
  areaMinSqm: z.number().positive().max(100000).optional(),
  notes: z.string().max(1000).optional(),
  assignedAgentId: z.string().optional(),
  status: z.enum(["NEW_INQUIRY", "CONTACTED", "QUALIFIED", "VIEWING_SCHEDULED", "VIEWING_OR_OFFER", "NEGOTIATING", "OFFER_MADE", "MANAGEMENT_HANDOVER", "VERIFICATION_CLOSING", "CLOSED"]).optional(),
  leadSource: LeadSourceEnum.default("OTHER"),
  propertyId: z.string().optional(),
  dealValue: z.number().positive().optional(),
});

export const createInquirySurfaceSchema = createInquirySchema.extend({
  propertyType: PropertyTypeEnum,
});

export const updateInquirySchema = z.object({
  expectedPropertyId: z.string().nullable().optional(),
  matchingProfile: matchingPreferencesSchema.optional(),
  contactId: z.string().optional(),
  // Pipeline fields
  status: z.enum(["NEW_INQUIRY", "CONTACTED", "QUALIFIED", "VIEWING_SCHEDULED", "VIEWING_OR_OFFER", "NEGOTIATING", "OFFER_MADE", "MANAGEMENT_HANDOVER", "VERIFICATION_CLOSING", "CLOSED"]).optional(),
  outcome: PipelineOutcomeEnum.optional(),
  lostReason: z.string().trim().min(10).max(2000).optional(),
  assignedAgentId: z.string().optional().nullable(),
  leadSource: LeadSourceEnum.optional(),
  propertyId: z.string().optional().nullable(),
  dealValue: z.number().positive().optional().nullable(),
  matchStatus: z.enum(["UNMATCHED", "PARTIALLY_MATCHED", "MATCHED"]).optional(),
  unmatchedReason: z.string().max(200).optional(),
  failedAtStage: z.enum(["VIEWING", "NEGOTIATION", "OFFER"]).optional(),

  // Client profile fields
  clientName: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  clientPhone: z.string().min(6).max(30).optional(),
  phone: z.string().min(6).max(30).optional(),
  clientEmail: z.string().email().optional().or(z.literal("")).or(z.null()),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  lookingFor: ListingTypeEnum.optional(),
  propertyType: PropertyTypeEnum.optional(),
  budgetMin: z.number().positive().optional().nullable(),
  budgetMax: z.number().positive().optional().nullable(),
  currency: CurrencyEnum.optional(),
  preferredSuburbs: z.array(z.string().trim().max(80)).transform(cleanLocationValues).optional(),
  bedroomsMin: z.number().int().min(0).max(50).optional().nullable(),
  bathroomsMin: z.number().min(0).max(50).optional().nullable(),
  areaMinSqm: z.number().positive().max(100000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateInquiryPipelineSchema = z.object({
  status: z.enum(["NEW_INQUIRY", "CONTACTED", "VIEWING_SCHEDULED", "NEGOTIATING", "OFFER_MADE", "MANAGEMENT_HANDOVER", "CLOSED"]),
  outcome: PipelineOutcomeEnum.optional(),
  lostReason: z.string().trim().min(10).max(2000).optional(),
  assignedAgentId: z.string().optional(),
  leadSource: LeadSourceEnum.optional(),
  propertyId: z.string().optional().nullable(),
  dealValue: z.number().positive().optional().nullable(),
  matchStatus: z.enum(["UNMATCHED", "PARTIALLY_MATCHED", "MATCHED"]).optional(),
  unmatchedReason: z.string().max(200).optional(),
  failedAtStage: z.enum(["VIEWING", "NEGOTIATION", "OFFER"]).optional(),
}).superRefine((value, ctx) => {
  if (value.status === "CLOSED" && !value.outcome) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["outcome"], message: "Closed inquiries require a won or lost outcome." });
  }
  if (value.status === "CLOSED" && value.outcome === "LOST" && !value.lostReason) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lostReason"], message: "A lost reason is required." });
  }
  if (value.outcome === "WON" && value.lostReason) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lostReason"], message: "Won inquiries cannot have a lost reason." });
  }
});

export const publicInquirySchema = z.object({
  org: z.string().min(1),
  clientName: z.string().min(2).max(100),
  clientPhone: z.string().min(6).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")),
  propertyId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(8).max(120).optional(),
});

export const createFollowUpTaskSchema = z.object({
  assignedUserId: z.string().min(1),
  inquiryId: z.string().optional(),
  propertyId: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string(), // ISO date string
});

export const updateFollowUpTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  dueDate: z.string().optional(),
  assignedUserId: z.string().optional(),
});
