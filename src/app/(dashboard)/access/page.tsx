import { AccessList } from "./accessList";

export default function AccessPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Tour Access</h1>
      <p className="text-muted-foreground text-sm">
        Manage buyer grants — phone, PIN, tour permissions, device seats, and
        expiry.
      </p>
      <AccessList />
    </div>
  );
}
