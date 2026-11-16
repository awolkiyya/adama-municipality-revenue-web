
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

import type {
  InvoiceDetail,
} from "@/types/invoice/invoice-detail";

// =====================================================
// TYPES
// =====================================================

export type UnpaidInvoiceFilters = {
  search: string;
  page?: number;
  per_page?: number;
};

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
  // UNPAID INVOICES
  // ---------------------------------------------------

  unpaid: () => [
    ...invoiceKeys.all,
    "unpaid",
  ],

  unpaidList: (
    params: UnpaidInvoiceFilters,
  ) => [
    ...invoiceKeys.unpaid(),
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
// Backend performs the actual filtering and searching.
// =====================================================

type UseInvoicesOptions = {
  params?: InvoiceFilters;
  enabled?: boolean;
  staleTime?: number;
};

export const useInvoices = ({
  params,
  enabled = true,
  staleTime = 1000 * 60 * 5,
}: UseInvoicesOptions = {}) => {

  return useQuery<
    ListResponse<Invoice, InvoiceSummary>
  >({

    queryKey:
      invoiceKeys.list(params),

    queryFn:
      () => invoiceService.getInvoices(params),

    enabled,

    staleTime,

    placeholderData:
      (previousData) => previousData,

  });

};

// =====================================================
// GET UNPAID INVOICES
// =====================================================
//
// GET /invoices/unpaid
//
// Required:
// - search (minimum 2 characters)
//
// Optional:
// - page
// - per_page
//
// Returns:
// - Paginated unpaid invoices
// - No summary
//
// =====================================================

type UseUnpaidInvoicesOptions = {
  params: UnpaidInvoiceFilters;
  enabled?: boolean;
  staleTime?: number;
};

export const useUnpaidInvoices = ({
  params,
  enabled = true,
  staleTime = 1000 * 60 * 2,
}: UseUnpaidInvoicesOptions) => {

  const search =
    params.search.trim();

  const validSearch =
    search.length >= 2;

  return useQuery<
    ListResponse<Invoice>
  >({

    queryKey:
      invoiceKeys.unpaidList({
        ...params,
        search,
      }),

    queryFn:
      () => invoiceService.getUnpaidInvoices({
        ...params,
        search,
      }),

    enabled:
      enabled &&
      validSearch,

    staleTime,

    placeholderData:
      (previousData) => previousData,

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
      invoiceKeys.detail(id),

    queryFn:
      () => invoiceService.getInvoiceById(id),

    enabled:
      enabled &&
      !!id,

    staleTime:
      1000 * 60 * 5,

  });

};
