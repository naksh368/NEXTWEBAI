import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AssistantChat } from "@/components/ai/assistant-chat";
import { AiAvatar } from "@/components/ui/ai-avatar";

export const metadata: Metadata = {
  title: "ExpertzTrip AI",
  description: "Describe your dream trip and get matched to real, published holiday packages — never invented prices or availability.",
};

export default function AiPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "ExpertzTrip AI" }]} />
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-white shadow-card"><AiAvatar size={28} /></span>
        <div>
          <h1 className="text-2xl font-bold">ExpertzTrip AI</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-muted"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Grounded in real packages — no invented prices or availability.</p>
        </div>
      </div>
      <div className="mt-6">
        <AssistantChat />
      </div>
    </Container>
  );
}
