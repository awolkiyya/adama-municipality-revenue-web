/**
 * src/services/taxpayer/taxpayer-invoice.service.ts
 *
 * Taxpayer Invoice Service
 *
 * Responsibility:
 * - Retrieve taxpayer invoices.
 * - Retrieve a single taxpayer invoice.
 *
 * Production mode:
 * - Uses the Laravel API.
 *
 * Backend resources:
 *
 * App\Modules\Taxpayer\Resources\TaxpayerInvoiceResource
 * App\Modules\Taxpayer\Resources\TaxpayerInvoiceItemResource
 */

import { api } from "@/lib/api";
import type { TaxpayerInvoice } from "@/types/taxpayer/invoice";

/* ========================================================================
 * API RESPONSE TYPES
 * ====================================================================== */

interface TaxpayerInvoicesResponse {
  data: TaxpayerInvoice[];
}

interface TaxpayerInvoiceResponse {
  data: TaxpayerInvoice;
}

/* ========================================================================
 * SERVICE
 * ====================================================================== */

export const taxpayerInvoiceService = {
  /**
   * Get all invoices belonging to the authenticated taxpayer.
   *
   * GET /api/v1/taxpayer/invoices
   */
  async getInvoices(): Promise<TaxpayerInvoice[]> {
    const response =
      await api.get<TaxpayerInvoicesResponse>(
        "/taxpayer/invoices",
      );

    return response.data.data;
  },

  /**
   * Get one invoice belonging to the authenticated taxpayer.
   *
   * GET /api/v1/taxpayer/invoices/{id}
   */
  async getInvoice(
    id: string,
  ): Promise<TaxpayerInvoice> {
    if (!id) {
      throw new Error("Invoice ID is required.");
    }

    const response =
      await api.get<TaxpayerInvoiceResponse>(
        `/taxpayer/invoices/${encodeURIComponent(id)}`,
      );

    return response.data.data;
  },
};

export default taxpayerInvoiceService;