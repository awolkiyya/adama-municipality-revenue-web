export type PaymentScheduleStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type PaymentScheduleInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
};

export type PaymentSchedule = {
  id: string;

  assessmentServiceId: string;

  installmentNumber: number;

  /**
   * Percentage rule actually applied when this
   * payment schedule was generated.
   *
   * Example:
   * "10.00" = 10% first-installment rule was applied.
   * null     = no percentage rule was applied.
   */
  rulePercentage: string | null;

  dueDate: string | null;

  amountDue: string;

  amountPaid: string;

  remainingAmount: string;

  status: PaymentScheduleStatus;

  paidAt: string | null;

  notes: string | null;

  invoice: PaymentScheduleInvoice | null;

  createdAt: string | null;

  updatedAt: string | null;
};