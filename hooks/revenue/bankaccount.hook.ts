"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  toast,
} from "sonner";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  BankAccount,
  BankAccountFilters,
  BankAccountFormData,
} from "@/types/revenue/bank-account";
import { bankAccountService } from "@/services/revenue/bankAccount.service";



// =====================================================
// QUERY KEYS
// =====================================================

export const bankAccountKeys = {

  // ---------------------------------------------------
  // ROOT
  // ---------------------------------------------------

  all: [
    "bank-accounts",
  ],

  // ---------------------------------------------------
  // LISTS
  // ---------------------------------------------------

  lists: () => [
    ...bankAccountKeys.all,
    "list",
  ],

  list: (
    params?: BankAccountFilters,
  ) => [
    ...bankAccountKeys.lists(),
    params,
  ],

  // ---------------------------------------------------
  // DETAILS
  // ---------------------------------------------------

  details: () => [
    ...bankAccountKeys.all,
    "detail",
  ],

  detail: (
    id: string,
  ) => [
    ...bankAccountKeys.details(),
    id,
  ],

};


// =====================================================
// GET BANK ACCOUNTS
// =====================================================

export const useBankAccounts = (
  params?: BankAccountFilters,
) => {

  return useQuery<
    ListResponse<BankAccount>
  >({

    queryKey:
      bankAccountKeys.list(
        params,
      ),

    queryFn:
      () =>
        bankAccountService.getBankAccounts(
          params,
        ),

    staleTime:
      1000 * 60 * 5,

    placeholderData:
      (
        previousData,
      ) =>
        previousData,

  });

};


// =====================================================
// GET BANK ACCOUNT DETAIL
// =====================================================

export const useBankAccount = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<BankAccount>
  >({

    queryKey:
      bankAccountKeys.detail(
        id,
      ),

    queryFn:
      () =>
        bankAccountService.getBankAccountById(
          id,
        ),

    enabled:
      enabled &&
      !!id,

    staleTime:
      1000 * 60 * 5,

  });

};


// =====================================================
// CREATE BANK ACCOUNT
// =====================================================

export const useCreateBankAccount = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: BankAccountFormData,
    ) =>
      bankAccountService.createBankAccount(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          bankAccountKeys.lists(),
      });

      toast.success(
        "Bank account created successfully",
      );

    },

  });

};


// =====================================================
// UPDATE BANK ACCOUNT
// =====================================================

export const useUpdateBankAccount = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: BankAccountFormData;
    }) =>
      bankAccountService.updateBankAccount(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          bankAccountKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          bankAccountKeys.detail(
            variables.id,
          ),
      });

      toast.success(
        "Bank account updated successfully",
      );

    },

  });

};


// =====================================================
// ACTIVATE BANK ACCOUNT
// =====================================================

export const useActivateBankAccount = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      id: string,
    ) =>
      bankAccountService.activateBankAccount(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          bankAccountKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          bankAccountKeys.detail(
            id,
          ),
      });

      toast.success(
        "Bank account activated successfully",
      );

    },

  });

};


// =====================================================
// DEACTIVATE BANK ACCOUNT
// =====================================================

export const useDeactivateBankAccount = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      id: string,
    ) =>
      bankAccountService.deactivateBankAccount(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          bankAccountKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          bankAccountKeys.detail(
            id,
          ),
      });

      toast.success(
        "Bank account deactivated successfully",
      );

    },

  });

};