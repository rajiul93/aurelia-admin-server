import { SettingsForm } from "./settings-form";

export default function SubscriptionPricingSettingsPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        Subscription Pricing Settings
      </h1>
      <p className="text-muted-foreground text-sm">
        Global settings that apply across all plans and device pricing tiers.
      </p>
      <SettingsForm />
    </div>
  );
}
