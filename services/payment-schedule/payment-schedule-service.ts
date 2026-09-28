import { api } from "@/lib/api";
import type {
  PaymentScheduleCreateInvoiceRequest,
  PaymentScheduleCreateInvoiceResponse,
  PaymentScheduleListResponse,
} from "@/types/payment-schedule/payment-schedule-api";

export const paymentScheduleService = {
  /**
   * Get all generated payment schedules for an assessment service.
   *
   * This endpoint only reads existing schedules.
   * It does NOT create or rebuild schedules.
   */
  async getByAssessmentService(
    assessmentServiceId: string,
  ): Promise<PaymentScheduleListResponse> {
    const response = await api.get<PaymentScheduleListResponse>(
      `/payment-schedules/${encodeURIComponent(assessmentServiceId)}`,
    );

    return response.data;
  },

  /**
   * Create an invoice from selected payment schedules.
   *
   * The client sends IDs only.
   *
   * The server is responsible for:
   * - validating ownership
   * - validating status
   * - checking existing invoices
   * - resolving remaining payable amounts
   * - calculating applicable financial charges
   * - creating the invoice
   * - creating invoice items
   * - aggregating totals
   */
  async createInvoice(
    payload: PaymentScheduleCreateInvoiceRequest,
  ): Promise<PaymentScheduleCreateInvoiceResponse> {
    const response =
      await api.post<PaymentScheduleCreateInvoiceResponse>(
        `/payment-schedules/${encodeURIComponent(
          payload.assessmentServiceId,
        )}/invoice`,
        {
          payment_schedule_ids: payload.paymentScheduleIds,
        },
      );

    return response.data;
  },
};