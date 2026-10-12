
import type {
    Payment,
    PaymentFilters,
  } from "@/types/payment/payment";
  
  import type { PaymentStatus } from "@/types/payment/payment-enums";
  
  // ============================================================
  // AGENT PAYMENT FILTERS
  // ============================================================
  
  export interface AgentPaymentFilters extends Omit<
    PaymentFilters,
    "processed_by" | "status"
  > {
    /**
     * Agent history is automatically scoped by the backend
     * to the authenticated user's processed_by ID.
     */
    status?: PaymentStatus | "";
  }
  
  // ============================================================
  // PAYMENT SUMMARY
  // ============================================================
  
  export interface AgentPaymentSummary {
    total_payments: number;
    total_collected: string;
    completed_count: number;
    pending_count: number;
    processing_count: number;
    failed_count: number;
    cancelled_count: number;
    reversed_count?: number;
    currency: string;
  }
  
  // ============================================================
  // TODAY SUMMARY
  // ============================================================
  
  export interface AgentPaymentTodaySummary
    extends AgentPaymentSummary {
    date: string;
  }
  
  // ============================================================
  // PAGINATION
  // ============================================================
  
  export interface AgentPaymentPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  }
  
  export interface AgentPaymentPage {
    items: Payment[];
    pagination: AgentPaymentPagination;
  }
  
  // ============================================================
  // DASHBOARD
  // ============================================================
  
  export interface AgentPaymentDashboard {
    date: string;
    overall: AgentPaymentSummary;
    today: AgentPaymentTodaySummary;
    recent_payments: Payment[];
  }