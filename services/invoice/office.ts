import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";
import { Invoice, InvoiceFilters } from "@/types/invoice/invoice";
import { InvoiceSummary } from "@/types/invoice/invoice-summary";



// =====================================================
// INVOICE SERVICE
// =====================================================

const cleanInvoiceParams = (
  params?: InvoiceFilters,
): Record<string, unknown> => {

  return Object.entries(
    params ?? {},
  ).reduce(
    (
      acc,
      [key, value],
    ) => {

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


export const invoiceService = {

  // ===================================================
  // GET ALL INVOICES
  // ===================================================
  //
  // Returns:
  //
  // data:
  //   Invoice[]
  //
  // meta:
  //   pagination
  //   summary
  //
  // ===================================================

  getInvoices: async (
    params?: InvoiceFilters,
  ): Promise<
    ListResponse<
      Invoice,
      InvoiceSummary
    >
  > => {

    try {

      const res =
        await api.get<
          ListResponse<
            Invoice,
            InvoiceSummary
          >
        >(
          "/invoices",
          {
            params:
              cleanInvoiceParams(
                params,
              ),
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // GET INVOICE DETAIL
  // ===================================================

  getInvoiceById: async (
    id: string,
  ): Promise<
    ApiResponse<Invoice>
  > => {

    try {

      const res =
        await api.get<
          ApiResponse<Invoice>
        >(
          `/invoices/${id}`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // CREATE INVOICE FROM ASSESSMENT
  // ===================================================
  //
  // The backend creates the invoice using the
  // approved assessment and its Decision Provider
  // snapshots.
  //
  // The frontend NEVER calculates invoice amounts.
  //
  // ===================================================

  createFromAssessment: async (
    assessmentId: string,
  ): Promise<
    ApiResponse<Invoice>
  > => {

    try {

      const res =
        await api.post<
          ApiResponse<Invoice>
        >(
          "/invoices",
          {
            assessment_id:
              assessmentId,
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // ISSUE INVOICE
  // ===================================================

  issueInvoice: async (
    id: string,
  ): Promise<
    ApiResponse<Invoice>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<Invoice>
        >(
          `/invoices/${id}/issue`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // CANCEL INVOICE
  // ===================================================

  cancelInvoice: async (
    id: string,
    reason: string,
  ): Promise<
    ApiResponse<Invoice>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<Invoice>
        >(
          `/invoices/${id}/cancel`,
          {
            reason,
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // VOID INVOICE
  // ===================================================

  voidInvoice: async (
    id: string,
    reason: string,
  ): Promise<
    ApiResponse<Invoice>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<Invoice>
        >(
          `/invoices/${id}/void`,
          {
            reason,
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // DELETE INVOICE
  // ===================================================
  //
  // Normally this should only be allowed for a DRAFT
  // invoice, depending on your backend policy.
  //
  // ===================================================

  deleteInvoice: async (
    id: string,
  ): Promise<
    ApiResponse<null>
  > => {

    try {

      const res =
        await api.delete<
          ApiResponse<null>
        >(
          `/invoices/${id}`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },

};