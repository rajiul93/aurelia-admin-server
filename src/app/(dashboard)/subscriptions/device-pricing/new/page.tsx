import { TierForm } from "../tier-form";

export default function NewDevicePricingTierPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add Device Pricing Tier</h1>
        <p className="text-muted-foreground text-sm">
          Set the extra cost for a specific total device count.
        </p>
      </div>
      <TierForm mode="create" />
    </div>
  );
}
