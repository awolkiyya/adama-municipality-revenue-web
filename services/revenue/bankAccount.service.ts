import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import {
  BankAccount,
  BankAccountFilters,
  BankAccountFormData,
} from "@/types/revenue/bank-account";

// =====================================================
// BANK ACCOUNT SERVICE
// =====================================================

const cleanBankAccountParams = (
  params?: BankAccountFilters,
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

export const bankAccountService = {

  // ===================================================
  // GET ALL BANK ACCOUNTS
  // ===================================================

  getBankAccounts: async (
    params?: BankAccountFilters,
  ): Promise<
    ListResponse<BankAccount>
  > => {

    try {

      const res =
        await api.get<
          ListResponse<BankAccount>
        >(
          "/revenue/bank-accounts",
          {
            params:
              cleanBankAccountParams(
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
  // GET BANK ACCOUNT DETAIL
  // ===================================================

  getBankAccountById: async (
    id: string,
  ): Promise<
    ApiResponse<BankAccount>
  > => {

    try {

      const res =
        await api.get<
          ApiResponse<BankAccount>
        >(
          `/revenue/bank-accounts/${id}`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );

    }
  },

  // ===================================================
  // CREATE BANK ACCOUNT
  // ===================================================

  createBankAccount: async (
    data: BankAccountFormData,
  ): Promise<
    ApiResponse<BankAccount>
  > => {

    try {

      const res =
        await api.post<
          ApiResponse<BankAccount>
        >(
          "/revenue/bank-accounts",
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );

    }
  },

  // ===================================================
  // UPDATE BANK ACCOUNT
  // ===================================================

  updateBankAccount: async (
    id: string,
    data: BankAccountFormData,
  ): Promise<
    ApiResponse<BankAccount>
  > => {

    try {

      const res =
        await api.put<
          ApiResponse<BankAccount>
        >(
          `/revenue/bank-accounts/${id}`,
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );

    }
  },

  // ===================================================
  // ACTIVATE BANK ACCOUNT
  // ===================================================

  activateBankAccount: async (
    id: string,
  ): Promise<
    ApiResponse<BankAccount>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<BankAccount>
        >(
          `/revenue/bank-accounts/${id}/activate`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );

    }
  },

  // ===================================================
  // DEACTIVATE BANK ACCOUNT
  // ===================================================

  deactivateBankAccount: async (
    id: string,
  ): Promise<
    ApiResponse<BankAccount>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<BankAccount>
        >(
          `/revenue/bank-accounts/${id}/deactivate`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );

    }
  },

};