import { SettingsSection } from "@/components/app/SettingsSection";
import { QboConnectCard } from "@/components/app/QboConnectCard";
import { getQboConnection } from "@/lib/qbo/connection";
import { Plug } from "lucide-react";

export default async function ConnectionsSettings({
  searchParams,
}: {
  searchParams: { qbo?: string; detail?: string };
}) {
  const qbo = await getQboConnection();

  return (
    <SettingsSection
      title="Connections"
      description="Link your books so RuledOff can see what is still open."
      icon={Plug}
    >
      <QboConnectCard
        connected={Boolean(qbo)}
        companyName={qbo?.company_name ?? null}
        realmId={qbo?.realm_id ?? null}
        status={searchParams.qbo}
        detail={searchParams.detail}
      />
    </SettingsSection>
  );
}
