import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFirm } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { loadTemplates } from "@/lib/chase";
import { BrandingForm, TemplateEditor } from "@/components/app/SettingsForms";
import type { EmailKind } from "@/lib/email/templates";

export const metadata: Metadata = { title: "Settings · RuledOff" };

const ORDER: EmailKind[] = ["initial", "level1", "level2", "level3", "level4"];

export default async function SettingsPage() {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const templates = await loadTemplates(createClient(), firm.id);

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Branding</h1>
          <p className="mt-1 text-sm text-ink-muted">
            How your firm appears to clients on the link and in emails.
          </p>
        </div>
        <BrandingForm
          name={firm.name}
          accentColor={firm.accent_color || "#A88B4C"}
          replyTo={firm.reply_to ?? ""}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Chase emails</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The escalation ladder: friendly, then specific, then consequence.
            Edit the wording; the checklist button is added automatically.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {ORDER.map((kind) => (
            <TemplateEditor
              key={kind}
              kind={kind}
              subject={templates[kind].subject}
              body={templates[kind].body}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
