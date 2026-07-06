import type { ControllerFieldState, FieldErrors, FieldPath, FieldValues } from "react-hook-form";

export function getMediaFieldError<T extends FieldValues>(
  fieldState: ControllerFieldState,
  formErrors: FieldErrors<T>,
  name: FieldPath<T>,
) {
  if (fieldState.error?.message) {
    return fieldState.error.message;
  }

  const fieldError = formErrors[name];

  if (
    fieldError &&
    typeof fieldError === "object" &&
    "file" in fieldError &&
    fieldError.file &&
    typeof fieldError.file === "object" &&
    "message" in fieldError.file &&
    typeof fieldError.file.message === "string"
  ) {
    return fieldError.file.message;
  }

  return undefined;
}
