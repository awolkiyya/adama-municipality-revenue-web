/**
 * src/hooks/taxpayer/use-taxpayer-invoices.ts
 *
 * React Query hooks for taxpayer invoices.
 */

import {
    useQuery,
  } from "@tanstack/react-query";
  
  import {
    taxpayerInvoiceService,
  } from "@/services/taxpayer/taxpayer-invoice.service";
  
  /* ========================================================================
   * QUERY KEYS
   * ====================================================================== */
  
  export const taxpayerInvoicesQueryKey = [
    "taxpayer",
    "invoices",
  ] as const;
  
  export const taxpayerInvoiceQueryKey = (
    id: string
  ) =>
    [
      "taxpayer",
      "invoices",
      id,
    ] as const;
  
  /* ========================================================================
   * INVOICE LIST
   * ====================================================================== */
  
  /**
   * Get all taxpayer invoices.
   */
  export function useTaxpayerInvoices() {
    return useQuery({
      queryKey: taxpayerInvoicesQueryKey,
  
      queryFn: () =>
        taxpayerInvoiceService.getInvoices(),
  
      staleTime: 60 * 1000,
    });
  }
  
  /* ========================================================================
   * SINGLE INVOICE
   * ====================================================================== */
  
  /**
   * Get one taxpayer invoice.
   */
  export function useTaxpayerInvoice(
    id: string
  ) {
    return useQuery({
      queryKey: taxpayerInvoiceQueryKey(id),
  
      queryFn: () =>
        taxpayerInvoiceService.getInvoice(id),
  
      enabled: Boolean(id),
  
      staleTime: 60 * 1000,
    });
  }