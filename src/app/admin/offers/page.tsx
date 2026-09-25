import { redirect } from "next/navigation";

export default function DeprecatedOffersPage() {
  redirect("/admin/subscriptions");
}
