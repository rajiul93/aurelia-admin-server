"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Form, FormInput, FormSelect } from "@/components/form";
import {
  useCreateTransitionPoint,
  useDeleteTransitionPoint,
} from "@/hooks/mutations/use-floor-mutations";
import { getApiErrorMessage } from "@/lib/api/error-message";
import {
  transitionPointFormSchema,
  type TransitionPointFormInput,
} from "@/schemas/floor-form.schema";
import { TRANSITION_TYPE_OPTIONS, type Floor } from "@/types/floor";

const NO_CONNECTION_VALUE = "__none__";

type TransitionPointsDialogProps = {
  tourId: string;
  floor: Floor;
  allFloors: Floor[];
};

function floorLabel(floor: Floor) {
  const name = floor.translations[0]?.name;
  return name ? `Floor ${floor.floorNo} — ${name}` : `Floor ${floor.floorNo}`;
}

export function TransitionPointsDialog({
  tourId,
  floor,
  allFloors,
}: TransitionPointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createPoint = useCreateTransitionPoint(tourId);
  const deletePoint = useDeleteTransitionPoint(tourId);
  const askConfirm = useConfirm();

  const form = useForm<TransitionPointFormInput>({
    resolver: zodResolver(transitionPointFormSchema),
    defaultValues: {
      type: "STAIRS",
      latitude: 0,
      longitude: 0,
      connectsToFloorId: NO_CONNECTION_VALUE,
      sortOrder: 0,
    },
  });

  // A transition can only lead to another floor of this same tour.
  const connectableFloors = allFloors.filter((entry) => entry.id !== floor.id);

  const connectOptions = [
    { label: "Not connected", value: NO_CONNECTION_VALUE },
    ...connectableFloors.map((entry) => ({
      label: floorLabel(entry),
      value: entry.id,
    })),
  ];

  const typeOptions = TRANSITION_TYPE_OPTIONS.map((type) => ({
    label: type.charAt(0) + type.slice(1).toLowerCase(),
    value: type,
  }));

  async function onSubmit(values: TransitionPointFormInput) {
    setSubmitError(null);

    try {
      await createPoint.mutateAsync({
        floorId: floor.id,
        payload: {
          type: values.type as (typeof TRANSITION_TYPE_OPTIONS)[number],
          latitude: values.latitude,
          longitude: values.longitude,
          connectsToFloorId:
            values.connectsToFloorId === NO_CONNECTION_VALUE
              ? null
              : values.connectsToFloorId,
          sortOrder: values.sortOrder,
        },
      });

      form.reset({
        type: "STAIRS",
        latitude: 0,
        longitude: 0,
        connectsToFloorId: NO_CONNECTION_VALUE,
        sortOrder: 0,
      });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Could not add transition point."),
      );
    }
  }

  async function handleDelete(pointId: string) {
    const confirmed = await askConfirm({
      title: "Remove this transition point?",
      description: "The link between these floors is deleted.",
      confirmLabel: "Remove",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setSubmitError(null);

    try {
      await deletePoint.mutateAsync({ floorId: floor.id, pointId });
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Could not remove transition point."),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <ArrowUpDown className="size-4" />
        Transitions
        {floor.transitionPoints.length > 0 ? (
          <Badge variant="secondary">{floor.transitionPoints.length}</Badge>
        ) : null}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Transitions — {floorLabel(floor)}</DialogTitle>
          <DialogDescription>
            Stairs, lifts, and ramps that carry a visitor from this floor to
            another one on the same tour.
          </DialogDescription>
        </DialogHeader>

        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        {floor.transitionPoints.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No transitions on this floor yet.
          </p>
        ) : (
          <div className="space-y-2">
            {floor.transitionPoints.map((point) => {
              const target = allFloors.find(
                (entry) => entry.id === point.connectsToFloorId,
              );

              return (
                <div
                  key={point.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {point.type.charAt(0) +
                        point.type.slice(1).toLowerCase()}
                      {target ? ` → ${floorLabel(target)}` : " — not connected"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={deletePoint.isPending}
                    onClick={() => handleDelete(point.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <Separator />

        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect name="type" label="Type" options={typeOptions} />
            <FormSelect
              name="connectsToFloorId"
              label="Leads to"
              options={connectOptions}
              disabled={connectableFloors.length === 0}
              description={
                connectableFloors.length === 0
                  ? "Add a second floor to connect this one."
                  : undefined
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              name="latitude"
              label="Latitude"
              type="number"
              step="any"
            />
            <FormInput
              name="longitude"
              label="Longitude"
              type="number"
              step="any"
            />
            <FormInput name="sortOrder" label="Order" type="number" min={0} />
          </div>

          <Button type="submit" disabled={createPoint.isPending}>
            {createPoint.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Add transition
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
