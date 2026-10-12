import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
ApiResponse,
ListResponse,
} from "@/types/api";

import type {
  Payment,
  PaymentFilters,
  } from "@/types/payment";

/**

* Remove empty filters before sending the request.
*
* Excludes:
* * undefined
* * null
* * empty strings
* * "ALL" filter values
    */
    const cleanPaymentParams = (
    params?: PaymentFilters,
    ): Record<string, unknown> => {
    return Object.entries(params ?? {}).reduce(
    (acc, [key, value]) => {
    if (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    value !== "ALL"
    ) {
    acc[key] = value;
    }

    return acc;
    },
    {} as Record<string, unknown>,
    );
    };

export const taxpayerPaymentService = {
/**

* Get the authenticated taxpayer's payment history.
*
* GET /api/v1/taxpayer/payments
  */
  getPayments: async (
  params?: PaymentFilters,
  ): Promise<ListResponse<Payment>> => {
  try {
  const response = await api.get<ListResponse<Payment>>(
  "/taxpayer/payments",
  {
  params: cleanPaymentParams(params),
  },
  );

  return response.data;
  } catch (error) {
  throw normalizeApiError(error);
  }
  },

/**

* Get one payment belonging to the authenticated taxpayer.
*
* GET /api/v1/taxpayer/payments/{payment}
  */
  getPayment: async (
  paymentId: string,
  ): Promise<ApiResponse<Payment>> => {
  try {
  const response = await api.get<ApiResponse<Payment>>(
  `/taxpayer/payments/${encodeURIComponent(paymentId)}`,
  );

  return response.data;
  } catch (error) {
  throw normalizeApiError(error);
  }
  },

/**

* Get receipt information for a completed payment.
*
* GET /api/v1/taxpayer/payments/{payment}/receipt
*
* The backend must authorize access to the payment and
* enforce receipt eligibility, normally requiring COMPLETED.
  */
  getPaymentReceipt: async (
  paymentId: string,
  ): Promise<ApiResponse<Payment>> => {
  try {
  const response = await api.get<ApiResponse<Payment>>(
  `/taxpayer/payments/${encodeURIComponent(paymentId)}/receipt`,
  );

  return response.data;
  } catch (error) {
  throw normalizeApiError(error);
  }
  },
  };
