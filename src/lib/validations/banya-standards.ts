import { z } from "zod";

/**
 * Banya Labs Canonical Input Validation Primitives
 * Standard across all Banya Boilerplate vertical SaaS ventures.
 */

// 1. Regional Phone Number Regex (Zambia +260, South Africa +27, Zimbabwe +263)
export const RegionalPhoneRegex = /^(\+?(260|27|263|254|234)[0-9]{9,11}|0[97][0-9]{8})$/;

// 2. Zambian National Registration Card (NRC) Regex (e.g. 194820/11/1)
export const ZambianNrcRegex = /^[0-9]{6}\/[0-9]{2}\/[1-9]$/;

// 3. South African National ID (13 digits with Luhn algorithm format)
export const SouthAfricanIdRegex = /^[0-9]{13}$/;

// 4. Standard Reusable Zod Primitives
export const banyaValidators = {
  // Strings
  requiredString: (fieldName: string, min = 2, max = 120) =>
    z
      .string({ required_error: `${fieldName} is required.` })
      .trim()
      .min(min, { message: `${fieldName} must be at least ${min} characters.` })
      .max(max, { message: `${fieldName} cannot exceed ${max} characters.` }),

  email: z
    .string({ required_error: "Email address is required." })
    .trim()
    .email({ message: "Please enter a valid email address." })
    .toLowerCase(),

  phone: z
    .string({ required_error: "Phone number is required." })
    .trim()
    .min(7, { message: "Phone number must be at least 7 digits." })
    .refine((val) => val.replace(/[\s\-\(\)]/g, "").length >= 7, {
      message: "Please enter a valid contact phone number.",
    }),

  nrcOrPassport: z
    .string({ required_error: "National ID (NRC) or Passport number is required." })
    .trim()
    .min(5, { message: "Identification number must be at least 5 characters." }),

  // Monetary & Numbers
  positiveCurrencyAmount: (fieldName: string) =>
    z
      .number({ required_error: `${fieldName} is required.` })
      .positive({ message: `${fieldName} must be greater than 0.` })
      .max(1000000000, { message: `${fieldName} exceeds maximum allowable threshold.` }),

  percentage: (fieldName: string = "Percentage") =>
    z
      .number({ required_error: `${fieldName} is required.` })
      .min(0, { message: `${fieldName} cannot be negative.` })
      .max(100, { message: `${fieldName} cannot exceed 100%.` }),

  // Enums & Standards
  currency: z.enum(["ZMW", "USD", "ZAR", "KES", "NGN"], {
    errorMap: () => ({ message: "Please select a supported regional currency (ZMW, USD, ZAR)." }),
  }),

  // Slug generator validator
  slug: z
    .string()
    .min(3)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must contain only lowercase alphanumeric characters and hyphens.",
    }),
};

/**
 * Standard Form Validation Result Formatter
 */
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string>; firstError: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  const firstError = result.error.issues[0]?.message || "Validation failed. Please check form inputs.";
  return { success: false, errors, firstError };
}
