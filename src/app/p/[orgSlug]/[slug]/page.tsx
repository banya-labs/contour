import PublicPropertyCardPage, { generateMetadata as baseGenerateMetadata } from "../../[slug]/page";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  return baseGenerateMetadata({
    params: Promise.resolve({ slug: `${resolved.orgSlug}/${resolved.slug}` }),
  });
}

export default async function OrganizationPropertyPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const resolved = await params;
  return PublicPropertyCardPage({
    params: Promise.resolve({ slug: `${resolved.orgSlug}/${resolved.slug}` }),
  });
}
