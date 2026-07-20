import { redirect } from "next/navigation";

// Settings is tabbed; the Plan tab is the default landing.
export default function SettingsIndex() {
  redirect("/settings/plan");
}
