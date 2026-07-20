import { TourList } from "./tourList";

export default function ToursPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tour Management</h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Create and manage downloadable tours with multilingual metadata and
          publish lifecycle.
        </p>
      </div>
      <TourList />
    </div>
  );
}
