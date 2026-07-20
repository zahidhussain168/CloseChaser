import { listTemplates } from "@/lib/data";
import { TemplatesManager } from "@/components/app/TemplatesManager";
import { SettingsSection } from "@/components/app/SettingsSection";

export default async function TemplatesSettings() {
  const requestTemplates = await listTemplates();

  return (
    <SettingsSection
      title="Request templates"
      description="Save the requests you send every month. Assign a template to a client and its items appear automatically in each new close."
    >
      <TemplatesManager templates={requestTemplates} />
    </SettingsSection>
  );
}
