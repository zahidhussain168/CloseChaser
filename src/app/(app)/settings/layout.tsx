import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFirm } from "@/lib/data";
import { SettingsTabs } from "@/components/app/SettingsTabs";

export const metadata: Metadata = { title: "Settings · RuledOff" };

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="kicker">Workspace</p>
        <h1 className="t-h2 mt-2 font-display font-semibold">Settings</h1>
      </div>
      <SettingsTabs />
      <div className="max-w-2xl">{children}</div>
    </div>
  );
}
