
import type {
  FieldErrors,
  FieldError,
  FieldValues,
} from "react-hook-form";

export function flattenFormErrors<T extends FieldValues>(
  errors: FieldErrors<T>,
): string[] {
  const result: string[] = [];

  const walk = (obj: Record<string, unknown>): void => {
    Object.values(obj).forEach((value) => {
      if (!value || typeof value !== "object") {
        return;
      }

      const error = value as FieldError;

      // Direct field error
      if (typeof error.message === "string" && error.message.length > 0) {
        result.push(error.message);
        return;
      }

      // Nested field errors
      walk(value as Record<string, unknown>);
    });
  };

  walk(errors as Record<string, unknown>);

  return result;
}
