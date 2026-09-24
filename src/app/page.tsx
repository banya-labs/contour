import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";

/**
 * Root route — always routes users to the appropriate destination.
 * - Authenticated users → /dashboard or /agent (role-based)
 * - Unauthenticated users → /sign-in
 *
 * The public marketing landing page is available at /home
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const headerList = await headers();
  const cookieStore = await cookies();

  const session = await auth.api.getSession({ headers: toAuthHeaders(headerList) });

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

  // Unauthenticated: always go to sign-in
  // Marketing landing page is at /home
  redirect("/sign-in");
}
