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
          value={
            props.type === "number"
              ? field.value === "" || field.value === null || field.value === undefined
                ? ""
                : String(field.value)
              : field.value
          }
          onBlur={(event) => {
            field.onBlur();
            onBlur?.(event);
          }}
          onChange={(event) => {
            const nextValue =
              props.type === "number"
                ? event.target.value === ""
                  ? 0
                  : event.target.valueAsNumber
                : event.target.value;

            field.onChange(nextValue);
            onChange?.(event);
          }}
          aria-invalid={field.invalid}
          {...props}
        />
      )}
    </FormField>
  );
}
