import { formatApiError } from "@/utils/apiError";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },

    mutations: {
      onError: (error: unknown) => {
        const err = formatApiError(error);

        // 1. Global message
        toast.error(err.message || "Unexpected error");
      },
    },
  },
});