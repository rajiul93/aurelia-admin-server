import { PurchasesList } from "./purchases-list";

export default function SubscriptionPurchasesPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
      <p className="text-muted-foreground text-sm">
        Self-service subscription purchases made from the mobile app.
      </p>
      <PurchasesList />
    </div>
  );
}
