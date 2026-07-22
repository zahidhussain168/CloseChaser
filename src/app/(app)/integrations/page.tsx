import type { Metadata } from "next";
import { IntegrationsGrid } from "@/components/app/IntegrationsGrid";
import { INTEGRATIONS } from "@/lib/integrations";
import { getQboConnection } from "@/lib/qbo/connection";
import { listRequestedIntegrations } from "@/app/(app)/integration-actions";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const [qbo, requested] = await Promise.all([
    getQboConnection(),
    listRequestedIntegrations(),
  ]);

  const connected: Record<string, boolean> = {
    quickbooks: Boolean(qbo),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">Integrations</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted">
          Connect the tools you already use. QuickBooks Online is live now. Tap
          Notify me on anything else and we will email you the moment it ships,
          and it moves up the list the more firms ask for it.
        </p>
      </div>

      <IntegrationsGrid
        integrations={INTEGRATIONS}
        connected={connected}
        requested={requested}
      />

      <p className="text-[13px] text-faint">
        Want something not listed here? Reply to any RuledOff email and tell us
        what would save you the most time.
      </p>
    </div>
  );
}
