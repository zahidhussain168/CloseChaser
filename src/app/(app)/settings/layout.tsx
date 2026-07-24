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
    <div className="flex flex-col gap-7">
      <div>
        <p className="kicker">Workspace</p>
        <h1 className="t-h2 mt-2 font-display font-semibold">Settings</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Manage {firm.name}: your plan, branding, connections, and how you chase.
        </p>
      </div>
      <SettingsTabs />
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
