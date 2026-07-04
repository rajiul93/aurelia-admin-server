import type { ComponentProps } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";

type FormInputProps<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  description?: string;
} & Omit<ComponentProps<typeof Input>, "name" | "id">;

export function FormInput<T extends FieldValues>({
  name,
  label,
  description,
  onChange,
  onBlur,
  ...props
}: FormInputProps<T>) {
  return (
    <FormField name={name} label={label} description={description}>
      {(field) => (
        <Input
          id={field.id}
          name={field.name}
          value={field.value}
          onBlur={(event) => {
            field.onBlur();
            onBlur?.(event);
          }}
          onChange={(event) => {
            field.onChange(event);
            onChange?.(event);
          }}
          aria-invalid={field.invalid}
          {...props}
        />
      )}
    </FormField>
  );
}
