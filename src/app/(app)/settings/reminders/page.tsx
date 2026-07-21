import { redirect } from "next/navigation";
import { getFirm } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { loadTemplates } from "@/lib/chase";
import { normaliseCadence } from "@/lib/reminders";
import { ChevronRight } from "lucide-react";
import { CadenceForm } from "@/components/app/CadenceForm";
import { TemplateEditor } from "@/components/app/SettingsForms";
import { SettingsSection } from "@/components/app/SettingsSection";
import { AiEmailGenerator } from "@/components/app/AiEmailGenerator";
import { isAiConfigured } from "@/lib/ai/emails";
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
        description="The escalation ladder: friendly, then specific, then consequence. Let RuledOff write them in your voice, or fine-tune any one by hand. The checklist button is added automatically."
      >
        <AiEmailGenerator configured={isAiConfigured()} />

        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-text">
            <ChevronRight size={15} className="transition-transform group-open:rotate-90" />
            Edit each email by hand
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {ORDER.map((kind) => (
              <TemplateEditor
                key={kind}
                kind={kind}
                subject={emails[kind].subject}
                body={emails[kind].body}
              />
            ))}
          </div>
        </details>
      </SettingsSection>
    </div>
  );
}
