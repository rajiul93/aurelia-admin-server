import { TourList } from "./tourList";

export default function ToursPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Tour Management</h1>
      <p className="text-muted-foreground text-sm">
        Create and manage downloadable tours with multilingual metadata and
        publish lifecycle.
      </p>
      <TourList />
    </div>
  );
}
