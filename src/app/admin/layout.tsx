import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlatformActor } from "@/lib/control-plane";
import { ControlPlaneShell } from "@/components/admin/control-plane-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession();
  if (!session?.user) redirect("/sign-in?redirect_url=%2Fadmin");
  const actor = await getPlatformActor(session.user.id, session.user.email);
  if (!actor) redirect("/admin/access-denied");
  return <ControlPlaneShell actor={{ role: actor.role, userId: actor.userId }}>{children}</ControlPlaneShell>;
}
