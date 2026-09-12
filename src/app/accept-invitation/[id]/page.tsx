"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [message, setMessage] = useState("Checking your invitation...");

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(`/accept-invitation/${params.id}`)}`);
      return;
    }
    void authClient.organization.acceptInvitation({ invitationId: params.id }).then((result) => {
      if (result.error) {
        setMessage(result.error.message || "This invitation could not be accepted.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  }, [isPending, params.id, router, session]);

  return <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-sm text-editorial-muted">{message}</main>;
}
