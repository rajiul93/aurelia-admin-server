"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IMAGE_ACCEPT } from "@/lib/media/constants";
import { validateClientImageFile } from "@/lib/media/validation";
import { cn } from "@/lib/utils";
import type { Media, MediaFieldValue } from "@/types/media";

type ImageUploadProps = {
  value: MediaFieldValue;
  onChange: (value: MediaFieldValue) => void;
  existingMedia?: Media | null;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
};

export function ImageUpload({
  value,
  onChange,
  existingMedia,
  label = "Image",
  description,
  error,
  disabled = false,
  isUploading = false,
  uploadProgress,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const localPreviewUrl = useMemo(() => {
    if (!value.file) {
      return null;
    }

    return URL.createObjectURL(value.file);
  }, [value.file]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const previewUrl =
    localPreviewUrl ??
    (!value.removeExisting ? existingMedia?.url : null) ??
    null;

  const displayError = error ?? validationError;

  function handleSelectFile(file: File) {
    const message = validateClientImageFile(file);
    if (message) {
      setValidationError(message);
      return;
    }

    setValidationError(null);
    onChange({
      file,
      removeExisting: false,
    });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    handleSelectFile(file);
  }

  function handleRemove() {
    setValidationError(null);
    onChange({
      file: null,
      removeExisting: Boolean(existingMedia),
    });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>

      <div className="flex items-start gap-4">
        <Avatar className="size-24 rounded-xl" data-size="lg">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Selected image preview" />
          ) : null}
          <AvatarFallback className="rounded-xl">
            <ImageIcon className="text-muted-foreground size-8" />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            disabled={disabled || isUploading}
            onChange={handleInputChange}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  {previewUrl ? "Replace image" : "Select image"}
                </>
              )}
            </Button>

            {previewUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isUploading}
                onClick={handleRemove}
              >
                <Trash2 className="mr-2 size-4" />
                Remove
              </Button>
            ) : null}
          </div>

          <p className="text-muted-foreground text-xs">
            JPEG, PNG, WebP, or GIF. Max 5 MB. Images upload when you save the
            form.
          </p>

          {isUploading && typeof uploadProgress === "number" ? (
            <div className="space-y-1">
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Uploading {uploadProgress}%
              </p>
            </div>
          ) : null}

          {displayError ? (
            <p className="text-destructive text-sm">{displayError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
