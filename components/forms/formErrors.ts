import type {
  FieldError,
  FieldErrors,
  FieldValues,
} from "react-hook-form";

type FieldErrorWithMessage = FieldError & {
  message: string;
};

function isFieldErrorWithMessage(
  value: unknown,
): value is FieldErrorWithMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export function flattenFormErrors<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
): string[] {
  const result: string[] = [];

  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") {
      return;
    }

    if (isFieldErrorWithMessage(value)) {
      result.push(value.message);
      return;
    }

    Object.values(value).forEach((nestedValue) => {
      walk(nestedValue);
    });
  };

  walk(errors);

  return result;
}