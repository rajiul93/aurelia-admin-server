"use client";

import type { FieldPath, FieldValues, Path, PathValue } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { QuillEditor } from "./quill-editor";
import { cn } from "@/lib/utils";

type FormQuillProps<T extends FieldValues> = {
  htmlName: FieldPath<T>;
  textName: FieldPath<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export function FormQuill<T extends FieldValues>({
  htmlName,
  textName,
  label,
  description,
  disabled,
  className,
  placeholder,
}: FormQuillProps<T>) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<T>();

  const valueHtml = (watch(htmlName) as string | undefined) ?? "";
  const htmlError = errors[htmlName];
  const errorMessage =
    htmlError && typeof htmlError === "object" && "message" in htmlError
      ? String(htmlError.message)
      : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={String(htmlName)}>{label}</Label>
      <QuillEditor
        valueHtml={valueHtml}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(answer) => {
          setValue(
            htmlName,
            answer.answer_html as PathValue<T, Path<T>>,
            { shouldDirty: true, shouldValidate: true },
          );
          setValue(
            textName,
            answer.answer_text as PathValue<T, Path<T>>,
            { shouldDirty: true, shouldValidate: true },
          );
        }}
      />
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
      {errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : null}
    </div>
  );
}
