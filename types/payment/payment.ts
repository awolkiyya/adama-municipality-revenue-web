// =====================================================
// PAYMENT
// =====================================================

export interface Payment {

    id: string;
  
    invoice_id: string | null;
  
    assessment_id: string | null;
  
    user_id: string | null;
  
    payment_method: string;
  
    payment_provider: string;
  
    status: string;
  
    transaction_reference: string;
  
    provider_reference: string | null;
  
    amount: number;
  
    currency: string;
  
    payer_name: string | null;
  
    payer_email: string | null;
  
    payer_phone: string | null;
  
    checkout_url: string | null;
  
    failure_reason: string | null;
  
    payment_date: string | null;
  
    verified_at: string | null;
  
    metadata: Record<
      string,
      unknown
    > | null;
  
    provider_response: Record<
      string,
      unknown
    > | null;
  
    created_at: string;
  
    updated_at: string;
  }
  
  
  // =====================================================
  // PAYMENT FILTERS
  // =====================================================
  
  export interface PaymentFilters {
  
    search?: string;
  
    transaction_reference?: string;
  
    provider_reference?: string;
  
    invoice_id?: string;
  
    assessment_id?: string;
  
    user_id?: string;
  
    payment_method?: string;
  
    payment_provider?: string;
  
    status?: string;
  
    currency?: string;
  
    amount_from?: number;
  
    amount_to?: number;
  
    payment_date_from?: string;
  
    payment_date_to?: string;
  
    verified_from?: string;
  
    verified_to?: string;
  
    page?: number;
  
    per_page?: number;
  
    sort_by?: string;
  
    sort_direction?: "asc" | "desc";
  }