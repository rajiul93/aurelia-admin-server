import { PlanForm } from "../plan-form";

export default function NewSubscriptionPlanPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add Plan</h1>
        <p className="text-muted-foreground text-sm">
          Create a new self-service subscription plan.
        </p>
      </div>
      <PlanForm mode="create" />
    </div>
  );
}
