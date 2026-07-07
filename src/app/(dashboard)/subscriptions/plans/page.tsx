import { PlansList } from "./plans-list";

export default function SubscriptionPlansPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Subscription Plans</h1>
      <p className="text-muted-foreground text-sm">
        Configure the plans mobile users can purchase — duration and base
        price.
      </p>
      <PlansList />
    </div>
  );
}
