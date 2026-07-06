import { StringForm } from "../string-form";

export default function NewAppUiStringPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add UI String</h1>
        <p className="text-muted-foreground text-sm">
          Create a CMS key with en / es / fr values.
        </p>
      </div>
      <StringForm mode="create" />
    </div>
  );
}
