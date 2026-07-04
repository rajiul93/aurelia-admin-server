import type { FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FormField } from "./form-field";

export type FormSelectOption = {
  label: string;
  value: string;
};

type FormSelectProps<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  description?: string;
  options: FormSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function FormSelect<T extends FieldValues>({
  name,
  label,
  description,
  options,
  placeholder,
  disabled,
  className,
}: FormSelectProps<T>) {
  return (
    <FormField name={name} label={label} description={description}>
      {(field) => (
        <select
          id={field.id}
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={disabled}
          aria-invalid={field.invalid}
          className={cn(
            "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            className,
          )}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
