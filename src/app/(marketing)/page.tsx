import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingContent } from "@/sections/MarketingContent";

export const metadata: Metadata = {
  // `absolute` skips the "%s · RuledOff" template so the home title is not doubled.
  title: { absolute: "RuledOff: stop chasing clients, close the month faster" },
  description:
    "RuledOff collects everything blocking a bookkeeper's month-end close and follows up with the client automatically, until every item is done.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return <MarketingContent />;
}
