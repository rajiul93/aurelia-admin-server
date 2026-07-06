"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { getMediaFieldError } from "@/components/form/media-field-error";
import type { MediaKind } from "@/lib/media/constants";
import { MediaFileUpload } from "./media-file-upload";
import type { Media } from "@/types/media";

type FormMediaFileUploadProps<T extends FieldValues> = {
  name: FieldPath<T>;
  kind: Extract<MediaKind, "video" | "audio">;
  existingMedia?: Media | null;
  label?: string;
  description?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
};

export function FormMediaFileUpload<T extends FieldValues>({
  name,
  kind,
  existingMedia,
  label,
  description,
  disabled,
  isUploading,
  uploadProgress,
  className,
}: FormMediaFileUploadProps<T>) {
  const { control, formState } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <MediaFileUpload
          value={field.value}
          onChange={field.onChange}
          existingMedia={existingMedia}
          kind={kind}
          label={label}
          description={description}
          error={getMediaFieldError(fieldState, formState.errors, name)}
          disabled={disabled}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          className={className}
        />
      )}
    />
  );
}
