import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { getFirm } from "@/lib/data";
import { saveOnboardingAction } from "./actions";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

const SOFTWARE = ["QuickBooks Online", "Xero", "QuickBooks Desktop", "Something else", "Not yet"];
const CLIENTS = ["1 to 5", "6 to 20", "21 to 50", "50+"];
const CHASE = ["Email", "Text or WhatsApp", "Phone calls", "No system yet"];
const HEARD = ["Google search", "A friend or colleague", "Social media", "A community or forum", "Other"];

function RadioGroup({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt} className="cursor-pointer">
          <input type="radio" name={name} value={opt} className="peer sr-only" />
          <span className="inline-flex items-center rounded-xl border border-line-strong px-3.5 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2 peer-checked:border-brand peer-checked:bg-brand-50 peer-checked:text-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand dark:peer-checked:bg-brand-tint">
            {opt}
          </span>
        </label>
      ))}
    </div>
  );
}

export default async function WelcomePage() {
  const firm = await getFirm();
  if (!firm) redirect("/login");
  if (firm.onboarded_at) redirect("/dashboard");

  const first = firm.name.split(/\s+/)[0];

  return (
    <main className="brand-wash flex min-h-dvh flex-col items-center px-5 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="sheet page-enter rounded-2xl p-6 shadow-elev2 sm:p-8">
          <span className="pill pill-brand mb-3">Step 1 of 1</span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">
            Welcome{first ? `, ${first}` : ""}.
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            A few quick things so we can tailor RuledOff to your firm. All optional, and it takes about 20 seconds.
          </p>

          <form action={saveOnboardingAction} className="mt-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-text">Which accounting software do you use?</span>
              <RadioGroup name="accounting_software" options={SOFTWARE} />
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-text">How many clients do you handle?</span>
              <RadioGroup name="client_count" options={CLIENTS} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">How do you chase clients today?</span>
                <select name="chase_method" className="field" defaultValue="">
                  <option value="" disabled>Choose one</option>
                  {CHASE.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">How did you hear about us?</span>
                <select name="referral_source" className="field" defaultValue="">
                  <option value="" disabled>Choose one</option>
                  {HEARD.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand px-5 py-3 text-[15px] font-semibold text-white shadow-brand transition-[background-color,transform] duration-150 hover:bg-brand-600 active:translate-y-[1px]"
              >
                Continue to dashboard
              </button>
              <button
                type="submit"
                name="skip"
                value="1"
                className="shrink-0 text-sm font-medium text-muted transition-colors hover:text-text"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
