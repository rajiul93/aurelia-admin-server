import { TiersList } from "./tiers-list";

export default function DevicePricingPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Device Pricing</h1>
      <p className="text-muted-foreground text-sm">
        Configure the extra cost for additional devices on a single purchase.
      </p>
      <TiersList />
    </div>
  );
}
