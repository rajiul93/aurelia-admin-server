import type { FieldPath, FieldValues } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  description?: string;
  className?: string;
  children: (field: {
    id: string;
    invalid: boolean;
    name: string;
    value: string;
    onChange: (...event: unknown[]) => void;
    onBlur: () => void;
  }) => React.ReactNode;
};

export function FormField<T extends FieldValues>({
  name,
  label,
  description,
  className,
  children,
}: FormFieldProps<T>) {
  const { control } = useFormContext<T>();
  const id = String(name);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-2", className)}>
          <Label htmlFor={id}>{label}</Label>
          {children({
            id,
            invalid: Boolean(fieldState.error),
            name: field.name,
            value: field.value ?? "",
            onChange: field.onChange,
            onBlur: field.onBlur,
          })}
          {description ? (
            <p className="text-muted-foreground text-xs">{description}</p>
          ) : null}
          {fieldState.error ? (
            <p className="text-destructive text-sm">{fieldState.error.message}</p>
          ) : null}
        </div>
      )}
    />
  );
}
