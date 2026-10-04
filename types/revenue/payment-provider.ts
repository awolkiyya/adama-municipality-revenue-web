export interface PaymentProvider {
    id: string;
    code: string;
    name: string;
    fee_percentage: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface PaymentProviderFormData {
    code: string;
    name: string;
    fee_percentage?: number;
    is_active?: boolean;
  }
  
  export interface PaymentProviderFilters {
    search?: string;
    is_active?: boolean;
    per_page?: number;
    page?: number;
  }