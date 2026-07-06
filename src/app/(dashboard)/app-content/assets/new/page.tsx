import { AssetForm } from "../asset-form";

export default function NewAppAssetPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add App Asset</h1>
        <p className="text-muted-foreground text-sm">
          Upload UI images or time-of-day backgrounds.
        </p>
      </div>
      <AssetForm mode="create" />
    </div>
  );
}
