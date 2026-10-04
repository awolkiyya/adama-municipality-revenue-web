import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type { ApiResponse } from "@/types/api";
import type { PaymentOption } from "@/types/revenue/payment-option";

export const paymentOptionService = {
  getPaymentOptions: async (): Promise<
    ApiResponse<PaymentOption>
  > => {
    try {
      const res =
        await api.get<ApiResponse<PaymentOption>>(
          "/revenue/payment-options",
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};