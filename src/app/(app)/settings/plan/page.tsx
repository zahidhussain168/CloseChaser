import { redirect } from "next/navigation";
import { getFirm } from "@/lib/data";
import { BillingCard } from "@/components/app/BillingCard";
import { SettingsSection } from "@/components/app/SettingsSection";
import { getSubscriptionState } from "@/lib/paddle/subscription";
import { CreditCard } from "lucide-react";

export default async function PlanSettings() {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const sub = getSubscriptionState(firm);
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? null;
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ?? null;
  const scalePriceId = process.env.NEXT_PUBLIC_PADDLE_SCALE_PRICE_ID ?? null;
  const billingConfigured = Boolean(process.env.PADDLE_API_KEY && priceId && clientToken);

  return (
    <SettingsSection
      title="Plan and billing"
      description="Your subscription, powered by Paddle. Cancel or update your card anytime."
      icon={CreditCard}
    >
      <BillingCard
        configured={billingConfigured}
        priceId={priceId}
        scalePriceId={scalePriceId}
        clientToken={clientToken}
        environment={
          (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") ?? "sandbox"
        }
        status={sub.status}
        active={sub.active}
        inTrial={sub.inTrial}
        trialDaysLeft={sub.trialDaysLeft}
        hasSubscription={sub.hasSubscription}
        currentPeriodEnd={sub.currentPeriodEnd}
        plan={firm.plan ?? null}
      />
    </SettingsSection>
  );
}
