import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/api";
import { ApiError } from "./ApiError";

export function normalizeApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const response = error.response?.data as ApiErrorResponse;

    return new ApiError(
      response?.message || error.message || "Unexpected error",
      error.response?.status,
    );
  }

  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(
    "Unexpected error occurred",
    500,
    "UNKNOWN_ERROR",
    null
  );
}

function isAxiosError(error: any): error is AxiosError {
  return error?.isAxiosError === true;
}