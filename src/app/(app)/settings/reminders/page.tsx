import { redirect } from "next/navigation";
import { getFirm } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { loadTemplates } from "@/lib/chase";
import { normaliseCadence } from "@/lib/reminders";
import { CadenceForm } from "@/components/app/CadenceForm";
import { TemplateEditor } from "@/components/app/SettingsForms";
import { SettingsSection } from "@/components/app/SettingsSection";
import type { EmailKind } from "@/lib/email/templates";

const ORDER: EmailKind[] = ["initial", "level1", "level2", "level3", "level4"];

export default async function RemindersSettings() {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const emails = await loadTemplates(createClient(), firm.id);
  const cadence = normaliseCadence({
    offsets: (firm as { reminder_offsets?: number[] }).reminder_offsets,
    weeklyStep: (firm as { reminder_weekly_step?: number }).reminder_weekly_step,
  });

  return (
    <div className="flex flex-col gap-10">
      <SettingsSection
        title="Reminder cadence"
        description="When the chase emails go out. The wording of each one is below."
      >
        <CadenceForm offsets={cadence.offsets} weeklyStep={cadence.weeklyStep} />
      </SettingsSection>

      <SettingsSection
        title="Chase emails"
        description="The escalation ladder: friendly, then specific, then consequence. Edit the wording; the checklist button is added automatically."
      >
        <div className="flex flex-col gap-3">
          {ORDER.map((kind) => (
            <TemplateEditor
              key={kind}
              kind={kind}
              subject={emails[kind].subject}
              body={emails[kind].body}
            />
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
