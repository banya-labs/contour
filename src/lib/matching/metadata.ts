import { z } from "zod";
import { Currency, ListingType, PropertyType } from "@prisma/client";
import type { InquiryMatchingProfile, MatchingMetadata } from "./types";

const metadataSchema = z.object({
  propertyType: z.nativeEnum(PropertyType).optional(), listingType: z.nativeEnum(ListingType).optional(), currency: z.nativeEnum(Currency).optional(),
  suburb: z.string().optional(), nearbyAreas: z.array(z.string()).default([]), bedroomsMin: z.number().optional(),
  bathroomsMin: z.number().optional(), price: z.number().optional(), features: z.array(z.string()).default([]), keywords: z.array(z.string()).default([]),
});

export async function extractMatchingMetadata(input: { kind: "property" | "inquiry"; text: string }): Promise<MatchingMetadata | InquiryMatchingProfile | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "HTTP-Referer": "https://contour.banyalabs.com", "X-Title": "Contour Matching" },
    body: JSON.stringify({ model, response_format: { type: "json_object" }, temperature: 0, messages: [
      { role: "system", content: `Extract only factual property matching fields from this ${input.kind}. Return JSON only. Do not invent missing values. Use arrays for areas, features, and keywords.` },
      { role: "user", content: input.text },
    ] }),
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  const content = (payload as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;
  if (!content) return null;
  try { return metadataSchema.parse(JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim())); } catch { return null; }
}
