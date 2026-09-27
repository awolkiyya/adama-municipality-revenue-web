"use client";

import { useCallback } from "react";

import type {
  RevenueField,
} from "@/types/revenue/assessment";
import { FieldValue } from "@/types/assessment/assessment-form.types";



type UseAssessmentFileFieldsParams = {
  setServiceFieldValue: (
    serviceId: string,
    fieldKey: string,
    value: FieldValue,
  ) => void;
};

export const useAssessmentFileFields = ({
  setServiceFieldValue,
}: UseAssessmentFileFieldsParams) => {
  const handleFileChange = useCallback(
    (
      serviceId: string,
      field: RevenueField,
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const files = Array.from(
        event.target.files ?? [],
      );

      if (field.type === "MULTI_FILE") {
        setServiceFieldValue(
          serviceId,
          field.key,
          files,
        );

        return;
      }

      setServiceFieldValue(
        serviceId,
        field.key,
        files[0] ?? null,
      );
    },
    [setServiceFieldValue],
  );

  const handleRemoveFile = useCallback(
    (
      serviceId: string,
      field: RevenueField,
      index?: number,
      currentValue?: FieldValue,
    ) => {
      if (field.type === "MULTI_FILE") {
        const currentFiles =
          Array.isArray(currentValue)
            ? currentValue
            : [];

        if (
          index === undefined ||
          index < 0 ||
          index >= currentFiles.length
        ) {
          return;
        }

        const nextFiles =
          currentFiles.filter(
            (_, fileIndex) =>
              fileIndex !== index,
          );

        setServiceFieldValue(
          serviceId,
          field.key,
          nextFiles,
        );

        return;
      }

      setServiceFieldValue(
        serviceId,
        field.key,
        null,
      );
    },
    [setServiceFieldValue],
  );

  return {
    handleFileChange,
    handleRemoveFile,
  };
};