"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_LABEL,
  PHONE_PREVIEW_FRAME_CLASS,
  PHONE_PREVIEW_MEDIA_CLASS,
} from "@/lib/media/constants";
import { validateClientImageFile } from "@/lib/media/validation";
import { cn } from "@/lib/utils";
import type { MediaFieldValue } from "@/types/media";

type ImageUploadProps = {
  value: MediaFieldValue;
  onChange: (value: MediaFieldValue) => void;
  // Only the URL is read to render the preview, so any media-like object with a
  // url works (e.g. a floor cover DTO carrying just { id, url }).
  existingMedia?: { url: string } | null;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
  /**
   * "phone" renders a tall 9:19.5 preview instead of the small square one, for
   * artwork that fills a phone screen (app backgrounds). A square thumbnail
   * crops those to the point where you cannot tell what you picked.
   */
  previewShape?: "square" | "phone";
};

function UploadControls({
  inputRef,
  previewUrl,
  disabled,
  isUploading,
  uploadProgress,
  displayError,
  onChange,
  onRemove,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  previewUrl: string | null;
  disabled: boolean;
  isUploading: boolean;
  uploadProgress?: number;
  displayError: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={onChange}
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
            onClick={onRemove}
          >
            <Trash2 className="mr-2 size-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">
        JPEG, PNG, WebP, or GIF. Max {MAX_IMAGE_SIZE_LABEL}. Images upload when
        you save the form.
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
    </>
  );
}

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
  previewShape = "square",
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

      {previewShape === "phone" ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="space-y-2 lg:shrink-0">
            <p className="text-muted-foreground text-center text-xs lg:text-left">
              Phone preview (9:19.5)
            </p>
            <div className={PHONE_PREVIEW_FRAME_CLASS}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Selected image preview"
                  className={PHONE_PREVIEW_MEDIA_CLASS}
                />
              ) : (
                <div
                  className={cn(
                    PHONE_PREVIEW_MEDIA_CLASS,
                    "bg-muted flex items-center justify-center",
                  )}
                >
                  <ImageIcon className="text-muted-foreground size-12" />
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <UploadControls
              inputRef={inputRef}
              previewUrl={previewUrl}
              disabled={disabled}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              displayError={displayError}
              onChange={handleInputChange}
              onRemove={handleRemove}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <Avatar className="size-24 rounded-xl" data-size="lg">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Selected image preview" />
            ) : null}
            <AvatarFallback className="rounded-xl">
              <ImageIcon className="text-muted-foreground size-8" />
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <UploadControls
              inputRef={inputRef}
              previewUrl={previewUrl}
              disabled={disabled}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              displayError={displayError}
              onChange={handleInputChange}
              onRemove={handleRemove}
            />
          </div>
        </div>
      )}
    </div>
  );
}
