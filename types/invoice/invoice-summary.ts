export interface InvoiceSummary {
    total_invoices: number;
  
    subtotal: number;
    discount_amount: number;
    penalty_amount: number;
  
    total_amount: number;
    paid_amount: number;
    balance_due: number;
  
    status_counts: {
      DRAFT: number;
      ISSUED: number;
      PARTIALLY_PAID: number;
      PAID: number;
      OVERDUE: number;
      CANCELLED: number;
      VOID: number;
    };
  }