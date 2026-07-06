import { AuditLogList } from "./audit-log-list";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground text-sm">
          Immutable record of staff actions across tours, spots, access, and app
          content.
        </p>
      </div>
      <AuditLogList />
    </div>
  );
}
