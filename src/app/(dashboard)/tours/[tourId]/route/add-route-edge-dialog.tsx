"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormInput, FormSelect, FormTextarea } from "@/components/form";
import { useCreateRouteEdge } from "@/hooks/mutations/use-tour-route-mutations";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import {
  parseFootprintText,
  routeEdgeFormSchema,
  type RouteEdgeFormInput,
} from "@/schemas/tour-route-form.schema";
import type { Spot } from "@/types/spot";

type AddRouteEdgeDialogProps = {
  tourId: string;
  floorId: string;
  spots: Spot[];
  edgeCount: number;
  disabled?: boolean;
};

export function AddRouteEdgeDialog({
  tourId,
  floorId,
  spots,
  edgeCount,
  disabled,
}: AddRouteEdgeDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const createEdge = useCreateRouteEdge(tourId, floorId);

  const spotOptions = useMemo(
    () =>
      spots.map((spot) => {
        const title =
          getPreferredTranslation(spot.translations)?.title ??
          `Spot ${spot.sortOrder}`;
        return {
          label: `${spot.sortOrder}. ${title}`,
          value: spot.id,
        };
      }),
    [spots],
  );

  const form = useForm<RouteEdgeFormInput>({
    resolver: zodResolver(routeEdgeFormSchema),
    defaultValues: {
      fromSpotId: "",
      toSpotId: "",
      sortOrder: edgeCount,
      footprintText: "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      form.reset({
        fromSpotId: "",
        toSpotId: "",
        sortOrder: edgeCount,
        footprintText: "",
      });
      setSubmitError(null);
      setShowAdvanced(false);
    } else {
      setSubmitError(null);
    }
    setOpen(next);
  }

  async function onSubmit(values: RouteEdgeFormInput) {
    setSubmitError(null);

    try {
      const footprintGeo = parseFootprintText(values.footprintText);
      await createEdge.mutateAsync({
        fromSpotId: values.fromSpotId,
        toSpotId: values.toSpotId,
        sortOrder: values.sortOrder,
        footprintGeo,
      });
      form.reset({
        fromSpotId: values.toSpotId,
        toSpotId: "",
        sortOrder: values.sortOrder + 1,
        footprintText: "",
      });
      setOpen(false);
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, "Could not add route edge."),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-brand-tan/70"
            disabled={disabled}
          />
        }
      >
        <Plus className="size-4" />
        Add edge
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add route edge</DialogTitle>
          <DialogDescription>
            Connect two spots on this floor. For most tours, use{" "}
            <strong className="text-foreground font-medium">
              Generate from spots
            </strong>{" "}
            instead — then run{" "}
            <strong className="text-foreground font-medium">
              Generate footprints
            </strong>{" "}
            for walking paths.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              name="fromSpotId"
              label="From spot"
              options={spotOptions}
              placeholder="Select spot"
              disabled={createEdge.isPending}
            />
            <FormSelect
              name="toSpotId"
              label="To spot"
              options={spotOptions}
              placeholder="Select spot"
              disabled={createEdge.isPending}
            />
            <FormInput
              name="sortOrder"
              label="Order in route"
              type="number"
              min={0}
              disabled={createEdge.isPending}
            />
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-auto px-0 hover:bg-transparent"
              onClick={() => setShowAdvanced((value) => !value)}
            >
              {showAdvanced ? "Hide" : "Show"} custom footprint (optional)
            </Button>
            {showAdvanced ? (
              <FormTextarea
                name="footprintText"
                label="Footprint polyline"
                rows={4}
                placeholder={"41.8902,12.4922\n41.8910,12.4930"}
                disabled={createEdge.isPending}
              />
            ) : null}
          </div>

          <DialogFooter className="px-0 pb-0">
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={createEdge.isPending}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={createEdge.isPending}>
              {createEdge.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Add edge
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
