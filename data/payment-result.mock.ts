import { PaymentSummaryData } from "@/components/payment/PaymentSummary";

export const mockSuccessfulPayment: PaymentSummaryData = {
  transactionReference:
    "PAY-01M0NF2PJ4V0FZMQ8SPW6K2VPQ",

  invoiceNumber:
    "INV-2026-00124",

  amount: 100,

  currency: "ETB",

  provider: "Chapa",

  method: "Chapa",

  customerName:
    "Abdulbaasit Awol",

  customerEmail:
    "awolabdulbaasit143@gmail.com",

  date:
    "22 Aug 2026, 19:42",
};

export const mockFailedPayment: PaymentSummaryData = {
  transactionReference:
    "PAY-01M0NF5QW7PWSX4QEKDPMMGNET",

  invoiceNumber:
    "INV-2026-00124",

  amount: 100,

  currency: "ETB",

  provider: "Chapa",

  method: "Chapa",

  customerName:
    "Abdulbaasit Awol",

  customerEmail:
    "awolabdulbaasit143@gmail.com",

  date:
    "22 Aug 2026, 19:45",
};

export const mockPendingPayment: PaymentSummaryData = {
  transactionReference:
    "PAY-01M0NF7PENDING123456789",

  invoiceNumber:
    "INV-2026-00124",

  amount: 100,

  currency: "ETB",

  provider: "Chapa",

  method: "Chapa",

  customerName:
    "Abdulbaasit Awol",

  customerEmail:
    "awolabdulbaasit143@gmail.com",

  date:
    "22 Aug 2026, 19:48",
};