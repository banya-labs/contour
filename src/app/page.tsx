import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MarketingHome } from "@/components/marketing/marketing-home";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Run Your Real Estate Agency. Chase Nothing.",
  description:
    "The mandate operating system for Lusaka real estate agents. Fixed 5% commission, deal pipeline, title deed verification, cadastral spatial mapping, and automated WhatsApp arrears nudges.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Contour — Run Your Real Estate Agency. Chase Nothing.",
    description:
      "The premier real estate operations and field agent operating system for Lusaka and Southern Africa.",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Contour Real Estate Operating System",
      },
    ],
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const headerList = await headers();
  const cookieStore = await cookies();
  const isPwa =
    resolvedParams.source === "pwa" ||
    resolvedParams.source === "mobile" ||
    resolvedParams.source === "app" ||
    headerList.get("sec-ch-ua-mobile") === "?1" ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(headerList.get("user-agent") || "") ||
    cookieStore.get("contour_is_pwa")?.value === "true";

  const session = await auth.api.getSession({ headers: headerList });

  if (session?.user) {
    const lastPage = cookieStore.get("contour_last_page")?.value;
    const isValidLastPage =
      lastPage &&
      (lastPage.startsWith("/dashboard") || lastPage.startsWith("/agent") || lastPage.startsWith("/kiosk")) &&
      !lastPage.startsWith("/sign-in") &&
      !lastPage.startsWith("/login");

    if (isValidLastPage) {
      redirect(lastPage);
    }
    const isFieldAgent = session.user.role === "FIELD_AGENT" || !session.user.role;
    redirect(isFieldAgent ? "/agent" : "/dashboard");
  }

  if (isPwa) {
    redirect("/sign-in");
  }

  return <MarketingHome />;
}
