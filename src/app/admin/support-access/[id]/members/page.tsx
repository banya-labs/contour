"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { SupportMemberControls } from "@/components/admin/support-member-controls";

export default function SupportMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <main className="min-h-screen bg-editorial-bg px-4 py-6 font-geist text-editorial-black sm:px-8"><div className="mx-auto max-w-5xl space-y-7"><Link href="/admin/agencies" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-red"><ArrowLeft className="h-4 w-4" /> Agency directory</Link><header><p className="text-[10px] font-bold uppercase tracking-widest text-editorial-red">Act as agency // members</p><h1 className="mt-2 font-heading text-4xl font-bold uppercase">Member controls</h1></header><SupportMemberControls sessionId={id} /></div></main>;
}
