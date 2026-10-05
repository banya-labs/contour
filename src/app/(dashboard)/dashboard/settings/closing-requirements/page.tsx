import { redirect } from "next/navigation";

export default function ClosingRequirementsSettingsPage() {
  redirect("/dashboard/settings?tab=closing");
}
