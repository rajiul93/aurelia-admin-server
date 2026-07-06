"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormImageUpload, FormInput, FormSelect } from "@/components/form";
import {
  useCreateAppAsset,
  useUpdateAppAsset,
} from "@/hooks/mutations/use-app-content-mutations";
import { resolveMediaUpload } from "@/lib/media/client";
import {
  appAssetFormSchema,
  lifecycleOptions,
  timeOfDayOptions,
  type AppAssetFormInput,
} from "@/schemas/app-content-form.schema";
import type { AppAsset, TimeOfDay } from "@/types/app-content";
import { defaultMediaFieldValue } from "@/types/media";

type AssetFormProps = {
  mode: "create" | "edit";
  defaultValues?: AppAsset;
};

function toFormValues(record?: AppAsset): AppAssetFormInput {
  return {
    key: record?.key ?? "",
    lifecycle: record?.lifecycle ?? "ACTIVE",
    timeOfDay: record?.timeOfDay ?? "",
    media: defaultMediaFieldValue,
  };
}

export function AssetForm({ mode, defaultValues }: AssetFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const createAsset = useCreateAppAsset();
  const updateAsset = useUpdateAppAsset();

  const form = useForm<AppAssetFormInput>({
    resolver: zodResolver(appAssetFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const isPending = createAsset.isPending || updateAsset.isPending;

  async function onSubmit(values: AppAssetFormInput) {
    setSubmitError(null);

    try {
      const mediaId = await resolveMediaUpload(
        values.media,
        defaultValues?.mediaId,
        { onProgress: setUploadProgress },
      );

      if (!mediaId) {
        throw new Error("Image is required");
      }

      const payload = {
        key: values.key,
        lifecycle: values.lifecycle,
        mediaId,
        timeOfDay: (values.timeOfDay || null) as TimeOfDay | null,
      };

      if (mode === "edit" && defaultValues) {
        await updateAsset.mutateAsync({ id: defaultValues.id, payload });
      } else {
        await createAsset.mutateAsync(payload);
      }

      router.push("/app-content/assets");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save app asset.",
      );
    } finally {
      setUploadProgress(null);
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-6">
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Asset</CardTitle>
          <CardDescription>
            Supported keys: <code>background</code>,{" "}
            <code>background.morning</code>, <code>welcome.background</code>,{" "}
            or set <strong>Time of day</strong> for automatic switching. Lifecycle
            must be <strong>Active</strong> or <strong>Beta</strong> for the mobile
            app to receive the asset.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            name="key"
            label="Key"
            placeholder="background.morning"
            disabled={mode === "edit"}
          />
          <FormSelect
            name="timeOfDay"
            label="Time of day"
            options={timeOfDayOptions}
          />
          <FormSelect
            name="lifecycle"
            label="Lifecycle"
            options={lifecycleOptions}
          />
          <div className="sm:col-span-2">
            <FormImageUpload
              name="media"
              label="Image"
              existingMedia={defaultValues?.media}
              isUploading={isPending && uploadProgress !== null}
              uploadProgress={uploadProgress ?? undefined}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Create asset" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/app-content/assets" />}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
