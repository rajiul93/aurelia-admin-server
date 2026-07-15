"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { getMediaFieldError } from "@/components/form/media-field-error";
import { ImageUpload } from "./image-upload";

type FormImageUploadProps<T extends FieldValues> = {
  name: FieldPath<T>;
  // Any media-like object with a url; only the url is used for the preview.
  existingMedia?: { url: string } | null;
  label?: string;
  description?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
};

export function FormImageUpload<T extends FieldValues>({
  name,
  existingMedia,
  label,
  description,
  disabled,
  isUploading,
  uploadProgress,
  className,
}: FormImageUploadProps<T>) {
  const { control, formState } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <ImageUpload
          value={field.value}
          onChange={field.onChange}
          existingMedia={existingMedia}
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
