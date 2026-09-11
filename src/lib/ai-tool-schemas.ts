import { z } from "zod";
import {
  CurrencyEnum,
  ListingTypeEnum,
  PropertyTypeEnum,
  createInquirySchema,
} from "./validations";

const optionalOrganizationId = z.string().trim().min(1).max(100).optional();
const optionalNumber = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : Number(value)),
  z.number().finite().optional()
);

export const searchPropertiesToolSchema = z.object({
  organization_id: optionalOrganizationId,
  query: z.string().trim().max(200).optional(),
  suburb: z.string().trim().max(80).optional(),
  listingType: ListingTypeEnum.optional(),
  propertyType: PropertyTypeEnum.optional(),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  bedrooms: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : Number(value)),
    z.number().int().min(0).max(50).optional()
  ),
  limit: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? 10 : Number(value)),
    z.number().int().min(1).max(50).default(10)
  ),
}).refine(
  (value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
  { message: "minPrice must be less than or equal to maxPrice", path: ["minPrice"] }
);

export const rentalArrearsToolSchema = z.object({
  organization_id: optionalOrganizationId,
  minDaysOverdue: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? 1 : Number(value)),
    z.number().int().min(0).max(3650).default(1)
  ),
});

export const commissionToolSchema = z.object({ organization_id: optionalOrganizationId });

export const propertyDocumentsToolSchema = z.object({
  organization_id: optionalOrganizationId,
  propertyId: z.string().trim().min(1).max(100).optional(),
  category: z.enum([
    "TITLE_DEED",
    "SITE_SURVEY_DIAGRAM",
    "LEASE_CONTRACT",
    "NRC_PASSPORT_ID",
    "MANDATE_AGREEMENT",
  ]).optional(),
});

export const inquiryToolSchema = createInquirySchema.extend({
  organization_id: optionalOrganizationId,
  currency: CurrencyEnum.default("ZMW"),
});

export const aiToolSchemas = {
  search_properties: searchPropertiesToolSchema,
  get_rental_arrears: rentalArrearsToolSchema,
  get_revenue_commission: commissionToolSchema,
  get_property_documents: propertyDocumentsToolSchema,
  create_inquiry_or_lead: inquiryToolSchema,
} as const;

export type AiToolName = keyof typeof aiToolSchemas;
