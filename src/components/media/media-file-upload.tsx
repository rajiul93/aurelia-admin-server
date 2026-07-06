"use client";

import { useRef, useState } from "react";
import { FileIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
  AUDIO_ACCEPT,
  MAX_AUDIO_SIZE_LABEL,
  MAX_VIDEO_SIZE_LABEL,
  VIDEO_ACCEPT,
  type MediaKind,
} from "@/lib/media/constants";
import { validateClientMediaFile } from "@/lib/media/validation";
import { cn } from "@/lib/utils";
import type { Media, MediaFieldValue } from "@/types/media";

type MediaFileUploadProps = {
  value: MediaFieldValue;
  onChange: (value: MediaFieldValue) => void;
  existingMedia?: Media | null;
  kind: Extract<MediaKind, "video" | "audio">;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
};

function getKindCopy(kind: Extract<MediaKind, "video" | "audio">) {
  if (kind === "video") {
    return {
      accept: VIDEO_ACCEPT,
      extensions: ALLOWED_VIDEO_EXTENSIONS.join(", "),
      maxSize: MAX_VIDEO_SIZE_LABEL,
      selectLabel: "Select video",
      replaceLabel: "Replace video",
    };
  }

  return {
    accept: AUDIO_ACCEPT,
    extensions: ALLOWED_AUDIO_EXTENSIONS.join(", "),
    maxSize: MAX_AUDIO_SIZE_LABEL,
    selectLabel: "Select audio",
    replaceLabel: "Replace audio",
  };
}

export function MediaFileUpload({
  value,
  onChange,
  existingMedia,
  kind,
  label = "File",
  description,
  error,
  disabled = false,
  isUploading = false,
  uploadProgress,
  className,
}: MediaFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const copy = getKindCopy(kind);

  const selectedName =
    value.file?.name ??
    (!value.removeExisting ? existingMedia?.originalName : null);

  const displayError = error ?? validationError;

  function handleSelectFile(file: File) {
    const message = validateClientMediaFile(file, kind);
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
        <div className="bg-muted flex size-24 items-center justify-center rounded-xl">
          <FileIcon className="text-muted-foreground size-8" />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={copy.accept}
            className="hidden"
            disabled={disabled || isUploading}
            onChange={handleInputChange}
          />

          {selectedName ? (
            <p className="text-sm font-medium break-all">{selectedName}</p>
          ) : (
            <p className="text-muted-foreground text-sm">No file selected</p>
          )}

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
                  {selectedName ? copy.replaceLabel : copy.selectLabel}
                </>
              )}
            </Button>

            {selectedName ? (
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
            {copy.extensions.toUpperCase()}. Max {copy.maxSize}. Uploads when you
            save the form.
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
