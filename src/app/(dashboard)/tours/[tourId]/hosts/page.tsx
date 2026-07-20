"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useHosts } from "@/hooks/queries/use-hosts";
import { useDeleteHost } from "@/hooks/mutations/use-host-mutations";
import { HostFormDialog } from "./host-form-dialog";
import type { Host } from "@/types/host";

export default function HostsPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const { data: hosts = [], isLoading } = useHosts(tourId);
  const deleteHostMutation = useDeleteHost(tourId);
  const askConfirm = useConfirm();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);

  const handleDelete = async (host: Host) => {
    const confirmed = await askConfirm({
      title: `Delete host "${host.name}"?`,
      description: "This action cannot be undone.",
      destructive: true,
    });

    if (confirmed) {
      deleteHostMutation.mutate(host.id);
    }
  };

  const handleOpenDialog = (host?: Host) => {
    setEditingHost(host ?? null);
    setOpenDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hosts</h1>
          <p className="text-sm text-muted-foreground">Manage on-site hosts for this tour</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>Add Host</Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : hosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hosts yet. Add the first host to help visitors at the entrance.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {hosts.map((host) => (
            <div key={host.id} className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex-1">
                <h3 className="font-semibold">{host.name}</h3>
                {host.role && <p className="text-sm text-muted-foreground">{host.role}</p>}
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Lat: {host.latitude.toFixed(4)}</span>
                  <span>Lng: {host.longitude.toFixed(4)}</span>
                  {host.availableFrom && (
                    <span>
                      {host.availableFrom} - {host.availableTo}
                    </span>
                  )}
                  <span
                    className={
                      host.isAvailableNow
                        ? "text-green-600"
                        : !host.isActive
                          ? "text-red-600"
                          : "text-orange-600"
                    }
                  >
                    {host.isAvailableNow
                      ? "Available"
                      : !host.isActive
                        ? "Offline (deactivated)"
                        : "Offline (outside hours)"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(host)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(host)}
                  disabled={deleteHostMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HostFormDialog
        tourId={tourId}
        open={openDialog}
        onOpenChange={setOpenDialog}
        editingHost={editingHost}
      />
    </div>
  );
}
