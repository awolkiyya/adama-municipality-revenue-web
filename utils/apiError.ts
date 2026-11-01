
import axios from "axios";

type ApiErrorResponse = {
  message?: string;
  [key: string]: unknown;
};

type FormattedApiError = {
  message: string;
  status: number;
  data: ApiErrorResponse | null;
};

export function formatApiError(
  error: unknown,
): FormattedApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      message:
        error.response?.data?.message ??
        error.message ??
        "Unexpected error occurred",

      status: error.response?.status ?? 500,

      data: error.response?.data ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || "Unexpected error occurred",
      status: 500,
      data: null,
    };
  }

  return {
    message: "Unexpected error occurred",
    status: 500,
    data: null,
  };
}
