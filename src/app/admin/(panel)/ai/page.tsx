import { requireAdmin } from "@/lib/admin-auth";
import { isAiConfigured } from "@/lib/services/ai-service";
import { PageHeader, Panel } from "@/components/admin/ui";
import { AiAssistant } from "@/components/admin/ai-assistant";

export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  await requireAdmin("dashboard.view");
  const configured = isAiConfigured();

  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Draft and polish content — summaries, itineraries, inclusions and customer replies. Facts stay yours; the assistant never invents prices."
      />
      <Panel>
        <div className="p-4 sm:p-5">
          <AiAssistant configured={configured} />
        </div>
      </Panel>
    </>
  );
}
