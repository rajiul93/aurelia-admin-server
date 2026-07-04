"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { ImageUpload } from "./image-upload";
import type { Media } from "@/types/media";

type FormImageUploadProps<T extends FieldValues> = {
  name: FieldPath<T>;
  existingMedia?: Media | null;
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
  const { control } = useFormContext<T>();

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
          error={fieldState.error?.message}
          disabled={disabled}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          className={className}
        />
      )}
    />
  );
}
