import type { BankAccount } from "@/types/revenue/bank-account";
import type { PaymentProvider } from "@/types/revenue/payment-provider";

export type PaymentMethod =
  | "CASH"
  | "BANK"
  | "MOBILE_MONEY";

export interface PaymentOption {
  payment_methods: PaymentMethod[];
  bank_accounts: BankAccount[];
  payment_providers: PaymentProvider[];
}