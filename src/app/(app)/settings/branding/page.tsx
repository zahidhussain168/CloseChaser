import { redirect } from "next/navigation";
import { getFirm } from "@/lib/data";
import { BrandingForm } from "@/components/app/SettingsForms";
import { SettingsSection } from "@/components/app/SettingsSection";

export default async function BrandingSettings() {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  return (
    <SettingsSection
      title="Branding"
      description="How your firm appears to clients on the link and in emails."
    >
      <BrandingForm
        name={firm.name}
        accentColor={firm.accent_color || "#C49A2A"}
        replyTo={firm.reply_to ?? ""}
      />
    </SettingsSection>
  );
}
