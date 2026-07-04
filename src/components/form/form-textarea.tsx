import type { ComponentProps } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FormField } from "./form-field";

type FormTextareaProps<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  description?: string;
} & Omit<ComponentProps<"textarea">, "name" | "id">;

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  description,
  className,
  ...props
}: FormTextareaProps<T>) {
  return (
    <FormField name={name} label={label} description={description}>
      {(field) => (
        <textarea
          id={field.id}
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          aria-invalid={field.invalid}
          className={cn(
            "border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 flex min-h-24 w-full rounded-lg border px-2.5 py-2 text-base outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          {...props}
        />
      )}
    </FormField>
  );
}
