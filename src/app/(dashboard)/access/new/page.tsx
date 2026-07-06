import { TourAccessForm } from "../access-form";

export default function NewAccessPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Grant Tour Access</h1>
        <p className="text-muted-foreground text-sm">
          Create a Path A access record for a website buyer.
        </p>
      </div>
      <TourAccessForm mode="create" />
    </div>
  );
}
