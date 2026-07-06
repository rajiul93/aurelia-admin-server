import { TourForm } from "../tour-form";

export default function NewTourPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create Tour</h1>
        <p className="text-muted-foreground text-sm">
          Add tour metadata, spots, media, and FAQs in English, Spanish, and
          French.
        </p>
      </div>
      <TourForm mode="create" />
    </div>
  );
}
