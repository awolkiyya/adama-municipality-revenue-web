"use client";

import { useQuery } from "@tanstack/react-query";

import type { ApiResponse } from "@/types/api";

import {
  paymentOptionService,
} from "@/services/revenue/payment-option.service";
import { PaymentOption } from "@/types/revenue/payment-option";

export const paymentOptionKeys = {
  all: ["payment-options"],
};

export const usePaymentOptions = () => {
  return useQuery<ApiResponse<PaymentOption>>({
    queryKey: paymentOptionKeys.all,
    queryFn: () =>
      paymentOptionService.getPaymentOptions(),
    staleTime: 1000 * 60 * 5,
  });
};