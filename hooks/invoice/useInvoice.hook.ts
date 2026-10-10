// hooks/revenue/invoice.hook.ts

"use client";

import {
  useQuery,
} from "@tanstack/react-query";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  Invoice,
  InvoiceFilters,
} from "@/types/invoice/invoice";

import type {
  InvoiceSummary,
} from "@/types/invoice/invoice-summary";

import {
  invoiceService,
} from "@/services/invoice/invoice.service";
import { InvoiceDetail } from "@/types/invoice/invoice-detail";


// =====================================================
// QUERY KEYS
// =====================================================

export const invoiceKeys = {

  // ---------------------------------------------------
  // ROOT
  // ---------------------------------------------------

  all: [
    "invoices",
  ],

  // ---------------------------------------------------
  // LISTS
  // ---------------------------------------------------

  lists: () => [
    ...invoiceKeys.all,
    "list",
  ],

  list: (
    params?: InvoiceFilters,
  ) => [
    ...invoiceKeys.lists(),
    params,
  ],

  // ---------------------------------------------------
  // DETAILS
  // ---------------------------------------------------

  details: () => [
    ...invoiceKeys.all,
    "detail",
  ],

  detail: (
    id: string,
  ) => [
    ...invoiceKeys.details(),
    id,
  ],

};


// =====================================================
// GET INVOICES
// =====================================================
//
// GET /invoices
//
// Supports:
//
// - search
// - invoice_number
// - citizen_number
// - citizen_name
// - assessment_number
// - citizen_id
// - assessment_id
// - administrative_unit_id
// - fiscal_year
// - source_type
// - status
// - due_date_from
// - due_date_to
// - issued_from
// - issued_to
// - page
// - per_page
//
// Backend performs the actual filtering/searching.
// =====================================================

type UseInvoicesOptions = {
  params?: InvoiceFilters;
  enabled?: boolean;
};

export const useInvoices = ({
  params,
  enabled = true,
}: UseInvoicesOptions = {}) => {
  return useQuery<ListResponse<Invoice, InvoiceSummary>>({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoiceService.getInvoices(params),
    enabled,
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });
};




// =====================================================
// GET INVOICE DETAIL
// =====================================================
//
// GET /invoices/{id}
//
// =====================================================

export const useInvoice = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<InvoiceDetail>
  >({

    queryKey:
      invoiceKeys.detail(
        id,
      ),

    queryFn:
      () =>
        invoiceService.getInvoiceById(
          id,
        ),

    enabled:
      enabled &&
      !!id,

    staleTime:
      1000 * 60 * 5,

  });

};