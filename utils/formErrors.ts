import { FieldErrors, FieldError } from "react-hook-form";

export function flattenFormErrors(
  errors: FieldErrors<any>
): string[] {
  const result: string[] = [];

  const walk = (obj: FieldErrors<any>) => {
    if (!obj) return;

    Object.values(obj).forEach((value) => {
      if (!value) return;

      // direct error
      if ((value as FieldError).message) {
        result.push((value as FieldError).message as string);
        return;
      }

      // nested errors
      if (typeof value === "object") {
        walk(value as FieldErrors<any>);
      }
    });
  };

  walk(errors);

  return result;
}