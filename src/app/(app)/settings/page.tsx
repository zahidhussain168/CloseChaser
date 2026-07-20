import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFirm, listTemplates } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { loadTemplates } from "@/lib/chase";
import { BrandingForm, TemplateEditor } from "@/components/app/SettingsForms";
import { TemplatesManager } from "@/components/app/TemplatesManager";
import { QboConnectCard } from "@/components/app/QboConnectCard";
import { getQboConnection } from "@/lib/qbo/connection";
import type { EmailKind } from "@/lib/email/templates";

export const metadata: Metadata = { title: "Settings · RuledOff" };

const ORDER: EmailKind[] = ["initial", "level1", "level2", "level3", "level4"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { qbo?: string; detail?: string };
}) {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const [emails, requestTemplates, qbo] = await Promise.all([
    loadTemplates(createClient(), firm.id),
    listTemplates(),
    getQboConnection(),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-12">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="t-h2 font-display font-semibold">Branding</h1>
          <p className="mt-1 text-sm text-ink-muted">
            How your firm appears to clients on the link and in emails.
          </p>
        </div>
        <BrandingForm
          name={firm.name}
          accentColor={firm.accent_color || "#C59B3A"}
          replyTo={firm.reply_to ?? ""}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="t-h2 font-display font-semibold">Connections</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Link your books so RuledOff can see what is still open.
          </p>
        </div>
        <QboConnectCard
          connected={Boolean(qbo)}
          companyName={qbo?.company_name ?? null}
          realmId={qbo?.realm_id ?? null}
          status={searchParams.qbo}
          detail={searchParams.detail}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="t-h2 font-display font-semibold">Request templates</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Save the requests you send every month. Assign a template to a client
            and its items appear automatically in each new close.
          </p>
        </div>
        <TemplatesManager templates={requestTemplates} />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="t-h2 font-display font-semibold">Chase emails</h2>
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
              subject={emails[kind].subject}
              body={emails[kind].body}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
